import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const fixedExpenses = await prisma.fixedExpense.findMany({
            orderBy: { dueDay: 'asc' },
        });
        return NextResponse.json(fixedExpenses);
    } catch (error) {
        console.error("SERVER ERROR in /api/fixed-expenses:", error);
        return NextResponse.json({ error: 'Error fetching fixed expenses', details: String(error) }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const fixedExpense = await prisma.fixedExpense.create({
            data: {
                name: body.name,
                amount: parseFloat(body.amount),
                dueDay: parseInt(body.dueDay),
                category: body.category || 'Fixed Expense',
                autoPay: body.autoPay || false,
            },
        });
        return NextResponse.json(fixedExpense);
    } catch (error) {
        console.error("SERVER ERROR in /api/fixed-expenses POST:", error);
        return NextResponse.json({ error: 'Error creating fixed expense', details: String(error) }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const fixedExpense = await prisma.fixedExpense.update({
            where: { id: body.id },
            data: {
                name: body.name,
                amount: parseFloat(body.amount),
                dueDay: parseInt(body.dueDay),
                category: body.category,
            },
        });
        return NextResponse.json(fixedExpense);
    } catch (error) {
        console.error("SERVER ERROR in /api/fixed-expenses PUT:", error);
        return NextResponse.json({ error: 'Error updating fixed expense', details: String(error) }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.fixedExpense.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("SERVER ERROR in /api/fixed-expenses DELETE:", error);
        return NextResponse.json({ error: 'Error deleting fixed expense', details: String(error) }, { status: 500 });
    }
}
