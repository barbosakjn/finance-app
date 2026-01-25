
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TITLE_MAPPING: Record<string, string> = {
    "Housing": "Mercado",
    "Food": "Restaurante",
    "Shopping": "Shopping",
    "Financial": "Extras",
    "Other": "Mensal",
    "Transportation": "Gas",
    "Health": "Health",
    "Entertainment": "Entertaiment", // User requested 'Entertaiment' explicitly
    "Education": "Education",
    "IA STUFF": "IA Stuff"
};

async function main() {
    console.log("Starting Category Migration...");

    // 1. Transaction Migration
    for (const [oldName, newName] of Object.entries(TITLE_MAPPING)) {
        if (oldName === newName) continue;

        console.log(`Migrating Transactions: ${oldName} -> ${newName}`);
        const result = await prisma.transaction.updateMany({
            where: { category: oldName },
            data: { category: newName }
        });
        console.log(`Updated ${result.count} transactions.`);
    }

    // 2. Fixed Expense (Bills) Migration
    // User requested ALL bills (FixedExpense) to be "Mensal"
    console.log("Migrating ALL Fixed Expenses (Bills) to 'Mensal'...");
    const billsResult = await prisma.fixedExpense.updateMany({
        data: { category: "Mensal" }
    });
    console.log(`Updated ${billsResult.count} fixed expenses.`);

    console.log("Migration Complete.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
