import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const goals = await prisma.goal.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(goals);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching goals' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const goal = await prisma.goal.create({
            data: {
                name: body.name,
                targetAmount: parseFloat(body.targetAmount),
                currentAmount: parseFloat(body.currentAmount),
                targetDate: body.targetDate ? new Date(body.targetDate) : null,
            },
        });
        return NextResponse.json(goal);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating goal' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const goal = await prisma.goal.update({
            where: { id: body.id },
            data: {
                name: body.name,
                targetAmount: body.targetAmount ? parseFloat(body.targetAmount) : undefined,
                currentAmount: body.currentAmount ? parseFloat(body.currentAmount) : undefined,
                targetDate: body.targetDate ? new Date(body.targetDate) : undefined,
            },
        });
        return NextResponse.json(goal);
    } catch (error) {
        console.error("Error updating goal:", error);
        return NextResponse.json({ error: 'Error updating goal' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.goal.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting goal:", error);
        return NextResponse.json({ error: 'Error deleting goal' }, { status: 500 });
    }
}
