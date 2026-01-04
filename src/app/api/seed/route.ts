
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const bills = [
            { name: 'Dizimo', amount: 0, dueDay: 1, category: 'Church' },
            { name: 'Cell Phone', amount: 75.00, dueDay: 5, category: 'Utilities' },
            { name: 'Eletric', amount: 60.71, dueDay: 10, category: 'Utilities' },
            { name: 'Gás bill', amount: 54.38, dueDay: 10, category: 'Utilities' },
            { name: 'Seguro Saúde', amount: 74.76, dueDay: 15, category: 'Health' },
            { name: 'Google Fiber', amount: 56.10, dueDay: 15, category: 'Utilities' },
            { name: 'Stefani Credit card', amount: 30.00, dueDay: 20, category: 'Credit Card' },
            { name: 'NUBANK Cartão', amount: 68.19, dueDay: 20, category: 'Credit Card' },
            { name: 'Foccus EMERSON', amount: 210.00, dueDay: 25, category: 'Education' },
            { name: 'Malibu', amount: 96.72, dueDay: 1, category: 'Car' },
            { name: 'Elantra', amount: 370.96, dueDay: 1, category: 'Car' },
            { name: 'Car Insurance', amount: 236.66, dueDay: 5, category: 'Car' },
            { name: 'Gymnastics KAJUNA', amount: 165.00, dueDay: 10, category: 'Health' },
            { name: 'Paypal Credit Card', amount: 0, dueDay: 15, category: 'Credit Card' },
        ];

        const results = [];

        for (const bill of bills) {
            const exists = await prisma.fixedExpense.findFirst({
                where: { name: bill.name }
            });

            if (!exists) {
                const created = await prisma.fixedExpense.create({
                    data: {
                        name: bill.name,
                        amount: bill.amount,
                        dueDay: bill.dueDay,
                        category: bill.category,
                        autoPay: false
                    }
                });
                results.push(`Created: ${created.name}`);
            } else {
                results.push(`Skipped (exists): ${bill.name}`);
            }
        }

        // Trigger transaction check for this month
        // We can internally call the logic or just let the user hit the other endpoint later.
        // Let's just return the seeding result.

        return NextResponse.json({
            success: true,
            message: "Seeding complete",
            results
        });

    } catch (error) {
        console.error("Error seeding:", error);
        return NextResponse.json({ error: 'Error seeding database' }, { status: 500 });
    }
}
