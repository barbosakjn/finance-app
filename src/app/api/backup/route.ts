
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany();
        const fixedExpenses = await prisma.fixedExpense.findMany();

        return NextResponse.json({
            timestamp: new Date().toISOString(),
            transactions,
            fixedExpenses
        }, {
            headers: {
                'Content-Type': 'application/json',
                'Content-Disposition': `attachment; filename="finance_backup_${new Date().toISOString().split('T')[0]}.json"`
            }
        });
    } catch (error) {
        return NextResponse.json({ error: 'Backup failed' }, { status: 500 });
    }
}
