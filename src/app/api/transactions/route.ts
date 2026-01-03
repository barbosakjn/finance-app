import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const transactions = await prisma.transaction.findMany({
            orderBy: { date: 'desc' },
        });
        return NextResponse.json(transactions);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching transactions' }, { status: 500 });
    }
}

// Helper to parse date safely (prevents timezone shifts for YYYY-MM-DD)
const parseDateSafe = (dateString: string | Date | undefined): Date | undefined => {
    if (!dateString) return undefined;
    if (dateString instanceof Date) return dateString;
    // If string matches YYYY-MM-DD exactly, set time to noon to avoid timezone issues
    if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return new Date(`${dateString}T12:00:00`);
    }
    return new Date(dateString);
};

export async function POST(req: Request) {
    try {
        const { description, amount, category, type, date, status, dueDate, fixedExpenseId, isBill } = await req.json();

        // Basic validation
        if (!amount || !description || !type || !date) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const transaction = await prisma.transaction.create({
            data: {
                description,
                amount: parseFloat(amount),
                category: category || 'Uncategorized',
                type,
                date: parseDateSafe(date) as Date,
                status: status || 'PAID',
                dueDate: dueDate ? parseDateSafe(dueDate) : null,
                fixedExpenseId: fixedExpenseId || null,
                isBill: isBill || false,
            },
        });
        return NextResponse.json(transaction);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating transaction' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const transaction = await prisma.transaction.update({
            where: { id: body.id },
            data: {
                amount: body.amount ? parseFloat(body.amount) : undefined,
                description: body.description,
                date: body.date ? parseDateSafe(body.date) : undefined,
                category: body.category,
                status: body.status,
                dueDate: body.dueDate ? parseDateSafe(body.dueDate) : null,
            },
        });
        return NextResponse.json(transaction);
    } catch (error) {
        console.error("Error updating transaction:", error);
        return NextResponse.json({ error: 'Error updating transaction' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.transaction.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting transaction:", error);
        return NextResponse.json({ error: 'Error deleting transaction' }, { status: 500 });
    }
}
