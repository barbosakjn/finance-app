import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const investments = await prisma.investment.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return NextResponse.json(investments);
    } catch (error) {
        return NextResponse.json({ error: 'Error fetching investments' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const investment = await prisma.investment.create({
            data: {
                name: body.name,
                initialValue: parseFloat(body.initialValue),
                currentValue: parseFloat(body.currentValue),
                monthlyReturnRate: parseFloat(body.monthlyReturnRate),
                startDate: new Date(body.startDate),
            },
        });
        return NextResponse.json(investment);
    } catch (error) {
        return NextResponse.json({ error: 'Error creating investment' }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const investment = await prisma.investment.update({
            where: { id: body.id },
            data: {
                name: body.name,
                initialValue: body.initialValue ? parseFloat(body.initialValue) : undefined,
                currentValue: body.currentValue ? parseFloat(body.currentValue) : undefined,
                monthlyReturnRate: body.monthlyReturnRate ? parseFloat(body.monthlyReturnRate) : undefined,
                startDate: body.startDate ? new Date(body.startDate) : undefined,
            },
        });
        return NextResponse.json(investment);
    } catch (error) {
        console.error("Error updating investment:", error);
        return NextResponse.json({ error: 'Error updating investment' }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await prisma.investment.delete({
            where: { id },
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Error deleting investment:", error);
        return NextResponse.json({ error: 'Error deleting investment' }, { status: 500 });
    }
}
