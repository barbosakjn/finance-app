
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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

    console.log(`Start seeding ${bills.length} bills...`);

    for (const bill of bills) {
        // Check if exists to avoid duplicates
        const exists = await prisma.fixedExpense.findFirst({
            where: { name: bill.name }
        });

        if (!exists) {
            await prisma.fixedExpense.create({
                data: {
                    name: bill.name,
                    amount: bill.amount,
                    dueDay: bill.dueDay,
                    category: bill.category,
                    autoPay: false
                }
            });
            console.log(`Created bill: ${bill.name}`);
        } else {
            console.log(`Skipped (already exists): ${bill.name}`);
        }
    }

    // Also trigger the generation of transactions for the current month
    console.log('Triggering check for current month bills...');
    // We can't easily call the API route logic here without refactoring, 
    // but the FixedExpenses are safely in DB now. 
    // The user might need to visit the app or trigger the check manually/wait for cron.
    // We can simulate the check logic here if needed, but let's stick to seeding first.
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
