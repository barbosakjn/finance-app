
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Look for Uncategorized Expenses in the last 3 days
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const lostReceipts = await prisma.transaction.findMany({
            where: {
                type: 'EXPENSE',
                status: 'PAID',
                date: { gte: threeDaysAgo },
                OR: [
                    { category: 'Uncategorized' },
                    { category: 'Receipt Scan' }
                ]
            },
            orderBy: { date: 'desc' }
        });

        return NextResponse.json(lostReceipts);
    } catch (error) {
        return NextResponse.json({ error: 'Failed to find receipts' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const { ids } = await req.json();

        await prisma.transaction.updateMany({
            where: { id: { in: ids } },
            data: {
                date: new Date(), // Bring to NOW
                description: { set: undefined } // clear description? No. 
                // We just want to update the date.
            }
        });

        // Also ensure descriptions are marked as Recovered? Optional.

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to update receipts' }, { status: 500 });
    }
}
