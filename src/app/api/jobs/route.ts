import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/jobs  -> lista todos os trabalhos extras
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

// POST /api/jobs -> cria um novo trabalho extra
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

    const job = await prisma.jobExtra.create({
      data: {
        date: new Date(date),
        pickup,
        delivery,
        time: time ?? '', // pode ser vazio
        price: Number(price),
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