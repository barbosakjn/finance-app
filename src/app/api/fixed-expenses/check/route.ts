import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function POST() {
    try {
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getFullYear();

        const fixedExpenses = await prisma.fixedExpense.findMany();
        const generatedTransactions = [];

        for (const expense of fixedExpenses) {
            // Check if a transaction for this expense already exists for the current month
            // We check by fixedExpenseId AND date range
            const startOfMonth = new Date(currentYear, currentMonth, 1);
            const endOfMonth = new Date(currentYear, currentMonth + 1, 0);

            const existingTransaction = await prisma.transaction.findFirst({
                where: {
                    fixedExpenseId: expense.id,
                    date: {
                        gte: startOfMonth,
                        lte: endOfMonth,
                    },
                },
            });

            if (!existingTransaction) {
                // Create the transaction
                const dueDate = new Date(currentYear, currentMonth, expense.dueDay);

                // If due date is invalid (e.g. Feb 30), it will roll over to next month, 
                // but let's handle it simply for now or clamp to last day of month?
                // JS Date handles overflow by going to next month, which might be confusing.
                // Let's clamp to last day of month if needed.
                const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
                const safeDay = Math.min(expense.dueDay, lastDayOfMonth);
                const safeDueDate = new Date(currentYear, currentMonth, safeDay, 12, 0, 0);

                const newTransaction = await prisma.transaction.create({
                    data: {
                        amount: expense.amount,
                        description: `${expense.name} (Bill)`,
                        date: new Date(), // Created today
                        category: expense.category || 'Fixed Expense',
                        type: 'EXPENSE',
                        status: 'PENDING',
                        dueDate: safeDueDate,
                        fixedExpenseId: expense.id,
                        isBill: true,
                    },
                });
                generatedTransactions.push(newTransaction);
            }
        }

        return NextResponse.json({ generated: generatedTransactions.length, transactions: generatedTransactions });
    } catch (error) {
        console.error("Error generating recurring expenses:", error);
        return NextResponse.json({ error: 'Error generating expenses' }, { status: 500 });
    }
}
