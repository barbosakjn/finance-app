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

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const transaction = await prisma.transaction.create({
            data: {
                amount: parseFloat(body.amount),
                description: body.description,
                date: new Date(body.date),
                category: body.category,
                type: body.type,
                status: body.status || 'PAID',
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
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
                date: body.date ? new Date(body.date) : undefined,
                category: body.category,
                status: body.status,
                dueDate: body.dueDate ? new Date(body.dueDate) : null,
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
