import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/jobs  -> lista todos os jobs (ROUTE + EXTRA)
export async function GET() {
  try {
    const jobs = await prisma.jobExtra.findMany({
      orderBy: { date: 'asc' },
    });

    return NextResponse.json(jobs);
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json(
      { error: 'Erro ao buscar jobs' },
      { status: 500 }
    );
  }
}

// POST /api/jobs -> cria um job (pode ser ROUTE ou EXTRA)
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, pickup, delivery, time, price } = body;

    if (!date || !pickup || !delivery || price == null) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: date, pickup, delivery, price' },
        { status: 400 }
      );
    }

    // ⚠️ CORREÇÃO DE FUSO: força meio-dia
    // date vem como "yyyy-mm-dd", então viramos "yyyy-mm-ddT12:00:00"
    const parsedDate = new Date(`${date}T12:00:00`);
    const numericPrice = Number(price);

    // 1) cria o JobExtra
    const job = await prisma.jobExtra.create({
      data: {
        date: parsedDate,
        pickup,
        delivery,
        time: time ?? '',
        price: numericPrice,
      },
    });

    // 2) cria também uma Transaction de INCOME pra entrar no saldo
    await prisma.transaction.create({
      data: {
        type: 'INCOME',
        amount: numericPrice,
        description: `${pickup} → ${delivery}${time ? ` (${time})` : ''}`,
        date: parsedDate,
        category: 'Job',
        imageUrl: null,
        status: 'PAID',
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('Error creating job:', error);
    return NextResponse.json(
      { error: 'Erro ao criar job' },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs?id=JOB_ID  -> apaga um job
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Job id é obrigatório' },
        { status: 400 }
      );
    }

    await prisma.jobExtra.delete({
      where: { id },
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Error deleting job:', error);
    return NextResponse.json(
      { error: 'Erro ao apagar job' },
      { status: 500 }
    );
  }
}
