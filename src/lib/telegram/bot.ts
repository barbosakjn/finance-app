import { Telegraf, Context } from 'telegraf';
import { prisma } from '@/lib/prisma';

// Initialize Bot
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN || '');

// Helper: Fuzzy Match
function findBestMatch(text: string, bills: any[]) {
    const normalize = (str: string) => str.toLowerCase().replace(/[^a-z0-9]/g, '');
    const search = normalize(text);

    return bills.find(b => {
        const billName = normalize(b.description);
        return billName.includes(search) || search.includes(billName);
    });
}

// 1. Text Handler
bot.on('text', async (ctx) => {
    const text = ctx.message.text;
    const userId = ctx.from.id.toString();

    // Check Authorization
    const allowedUser = process.env.TELEGRAM_USER_ID;
    if (allowedUser && userId !== allowedUser) {
        return ctx.reply(`⛔ Unauthorized. Your ID: ${userId} (Add this to TELEGRAM_USER_ID in Vercel)`);
    }

    try {
        // A. Check for "Bill Payment" Intent
        // Look for PENDING bills
        const pendingBills = await prisma.transaction.findMany({
            where: {
                type: 'EXPENSE',
                status: 'PENDING',
                isBill: true
            }
        });

        // "Paguei a luz" -> removes "paguei", "a" -> searches "luz"
        const cleanText = text.toLowerCase().replace('paguei', '').replace('pagar', '').trim();
        const matchedBill = findBestMatch(cleanText, pendingBills);

        if (matchedBill) {
            // Found a bill! Ask for confirmation.
            // In a real scenario, we might use a callback query, but let's stick to simple text for now or simple "Yes/No" buttons.
            await ctx.reply(`Encontrei uma conta pendente: 📄 ${matchedBill.description} ($${matchedBill.amount}).\nDeseja marcar como PAGA?`, {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "✅ Sim, Pagar", callback_data: `pay_${matchedBill.id}` }],
                        [{ text: "❌ Não", callback_data: `cancel` }]
                    ]
                }
            });
            return;
        }

        // B. New Expense Intent
        // Pattern: "Item Amount" (e.g., "Uber 30")
        const match = text.match(/^(.+?)\s+(\d+(\.\d{1,2})?)$/);
        if (match) {
            const description = match[1].trim();
            const amount = parseFloat(match[2]);

            await prisma.transaction.create({
                data: {
                    description,
                    amount,
                    type: 'EXPENSE',
                    date: new Date(),
                    status: 'PAID', // Instant expense is usually paid
                    isBill: false,
                    category: 'Uncategorized' // Could infer later
                }
            });
            await ctx.reply(`✅ Despesa criada: ${description} - $${amount}`);
            return;
        }

        await ctx.reply("Não entendi. Diga 'Paguei Luz' ou 'Uber 20'.");

    } catch (e) {
        console.error(e);
        ctx.reply("Erro ao processar.");
    }
});

// 2. Action Handler (Buttons)
bot.action(/^pay_(.+)$/, async (ctx) => {
    const billId = ctx.match[1];
    await prisma.transaction.update({
        where: { id: billId },
        data: { status: 'PAID' }
    });
    await ctx.reply("✅ Conta marcada como PAGA!");
    // @ts-ignore
    await ctx.answerCbQuery();
});

// OpenAI Setup
import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 3. Photo Handler (Receipt Logic)
bot.on('photo', async (ctx) => {
    const userId = ctx.from.id.toString();
    const allowedUser = process.env.TELEGRAM_USER_ID;
    if (allowedUser && userId !== allowedUser) {
        return ctx.reply("⛔ Unauthorized.");
    }

    try {
        await ctx.reply("📸 Analisando recibo...");

        // Get File Link
        const fileId = ctx.message.photo[ctx.message.photo.length - 1].file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);

        // Analyze with OpenAI Vision
        const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: "Analyze this receipt. Return ONLY a JSON object with: { description: string, amount: number, date: string (YYYY-MM-DD) }." },
                        { type: "image_url", image_url: { url: fileLink.href } }
                    ]
                }
            ],
            max_tokens: 300
        });

        const content = response.choices[0].message.content;
        const cleanJson = content?.replace(/```json|```/g, '').trim();

        if (!cleanJson) throw new Error("No JSON found");

        const data = JSON.parse(cleanJson);

        if (data.amount && data.description) {
            await prisma.transaction.create({
                data: {
                    description: data.description,
                    amount: Math.abs(data.amount), // Force positive amount for correct expense calculation
                    type: 'EXPENSE',
                    status: 'PAID',
                    date: new Date(data.date || new Date()),
                    category: 'Receipt Scan',
                    isBill: false
                }
            });
            await ctx.reply(`✅ Recibo salvo!\n📝 ${data.description}\n💰 $${Math.abs(data.amount)}`);
        } else {
            await ctx.reply("❌ Não consegui ler o valor ou descrição.");
        }

    } catch (e) {
        console.error("Receipt Error:", e);
        await ctx.reply("Erra ao processar a imagem.");
    }
});

bot.action("cancel", async (ctx) => {
    await ctx.reply("Operação cancelada.");
    // @ts-ignore
    await ctx.answerCbQuery();
});

export async function handleTelegramWebhook(req: Request) {
    const body = await req.json();
    await bot.handleUpdate(body);
}
