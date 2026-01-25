
import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

const TITLE_MAPPING: Record<string, string> = {
    "Housing": "Mercado",
    "Food": "Restaurante",
    "Shopping": "Shopping",
    "Financial": "Extras",
    "Other": "Mensal",
    "Transportation": "Gas",
    "Health": "Health",
    "Entertainment": "Entertaiment",
    "Education": "Education",
    "IA STUFF": "IA Stuff"
};

export async function GET() {
    try {
        console.log("Starting Category Migration via API...");
        const log = [];

        // 1. Transaction Migration
        for (const [oldName, newName] of Object.entries(TITLE_MAPPING)) {
            if (oldName === newName) continue;

            const result = await prisma.transaction.updateMany({
                where: { category: oldName },
                data: { category: newName }
            });
            log.push(`Migrated ${oldName} -> ${newName}: ${result.count} transactions.`);
        }

        // 2. Fixed Expense (Bills) Migration
        const billsResult = await prisma.fixedExpense.updateMany({
            data: { category: "Mensal" }
        });
        log.push(`Migrated ALL Fixed Expenses to 'Mensal': ${billsResult.count} items.`);

        return NextResponse.json({ success: true, log });
    } catch (error) {
        console.error("Migration Error:", error);
        return NextResponse.json({ error: String(error) }, { status: 500 });
    }
}
