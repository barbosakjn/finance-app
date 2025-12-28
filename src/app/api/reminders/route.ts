import { prisma } from '@/lib/prisma';
import { bot } from '@/lib/telegram';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        // 1. Check Fixed Expenses due tomorrow
        const fixedExpenses = await prisma.fixedExpense.findMany({
            where: {
                dueDay: tomorrow.getDate(),
            },
        });

        // 2. Check Pending Transactions due tomorrow or overdue
        const pendingTransactions = await prisma.transaction.findMany({
            where: {
                status: 'PENDING',
                dueDate: {
                    lte: tomorrow,
                },
            },
        });

        // Send notifications
        const chatId = process.env.TELEGRAM_CHAT_ID;

        if (chatId) {
            let message = "";

            if (fixedExpenses.length > 0) {
                message += "📅 *Contas Fixas vencendo amanhã:*\n";
                fixedExpenses.forEach(e => {
                    message += `- ${e.name}: R$ ${e.amount}\n`;
                });
                message += "\n";
            }

            if (pendingTransactions.length > 0) {
                message += "⚠️ *Contas Pendentes vencendo:*\n";
                pendingTransactions.forEach(t => {
                    message += `- ${t.description}: R$ ${t.amount} (${t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'Sem data'})\n`;
                });
            }

            if (message) {
                await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
            }
        }

        return NextResponse.json({
            fixedExpenses,
            pendingTransactions,
            message: chatId ? "Notifications sent." : "No Chat ID configured."
        });
    } catch (error) {
        console.error("Error checking reminders:", error);
        return NextResponse.json({ error: 'Error checking reminders' }, { status: 500 });
    }
}
