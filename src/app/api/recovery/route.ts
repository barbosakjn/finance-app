
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        // Look for Uncategorized Expenses OR specific "lost" amounts
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const lostReceipts = await prisma.transaction.findMany({
            where: {
                OR: [
                    // Case 1: Uncategorized (General recovery)
                    {
                        category: 'Uncategorized',
                        date: { gte: threeDaysAgo }
                    },
                    {
                        category: 'Receipt Scan',
                        date: { gte: threeDaysAgo }
                    },
                    // Case 2: Specific "Ghost" amounts (Broad search, any status/date)
                    { amount: { gte: 4.80, lte: 4.90 } },
                    { amount: { gte: 38.10, lte: 38.20 } }
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
