import { bot } from '@/lib/telegram';
import { parseReceipt } from '@/lib/openai';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Ensure we don't attach listeners multiple times in dev
// In a real production serverless env, this might need a different approach,
// but for this setup, we'll attach if not already attached (hard to check with Telegraf)
// or just re-attach. To be safe, we can clear handlers?
// For simplicity, we'll define the logic here.

import { put } from '@vercel/blob';

bot.on('photo', async (ctx) => {
    try {
        const photo = ctx.message.photo[ctx.message.photo.length - 1];
        const fileId = photo.file_id;
        const fileLink = await ctx.telegram.getFileLink(fileId);

        console.log('Received photo from Chat ID:', ctx.chat.id);

        ctx.reply('Processando sua imagem... ⏳');

        // 1. Upload to Vercel Blob
        const response = await fetch(fileLink.href);
        const blob = await response.blob();
        const { url } = await put(`receipts/${fileId}.jpg`, blob, { access: 'public' });

        // 2. Parse with OpenAI
        const transactionData = await parseReceipt(url); // Use the permanent Blob URL

        if (!transactionData) {
            ctx.reply('Não consegui ler o recibo. Tente novamente com uma foto mais clara.');
            return;
        }

        const transaction = await prisma.transaction.create({
            data: {
                amount: transactionData.amount,
                description: transactionData.description,
                date: new Date(transactionData.date),
                category: transactionData.category,
                type: transactionData.type,
                imageUrl: url, // Store the permanent Blob URL
            },
        });

        ctx.reply(
            `✅ Transação salva!\n\n` +
            `💰 Valor: R$ ${transaction.amount}\n` +
            `📝 Desc: ${transaction.description}\n` +
            `📂 Cat: ${transaction.category}\n` +
            `📅 Data: ${transaction.date.toLocaleDateString()}`
        );
    } catch (error) {
        console.error('Error processing photo:', error);
        ctx.reply('Ocorreu um erro ao processar sua imagem.');
    }
});

bot.on('text', (ctx) => {
    ctx.reply('Envie uma foto de um recibo para eu processar, ou use o app para gerenciar suas finanças.');
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        // Telegraf expects the update object
        await bot.handleUpdate(body);
        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Error in Telegram webhook:', error);
        return NextResponse.json({ ok: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
