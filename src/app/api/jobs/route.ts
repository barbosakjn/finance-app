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

    // ⚠️ CORREÇÃO DE FUSO E FORMATO
    // Tenta validar o formato YYYY-MM-DD antes de forçar o horário
    let parsedDate: Date;

    if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
      // Se for exatamente YYYY-MM-DD, adicionamos meio-dia
      parsedDate = new Date(`${date}T12:00:00`);
    } else {
      // Tenta parsear direto (caso venha ISO ou outro formato)
      parsedDate = new Date(date);
    }

    if (isNaN(parsedDate.getTime())) {
      return NextResponse.json(
        { error: `Data inválida recebida: ${date}` },
        { status: 400 }
      );
    }

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
      { error: `Erro ao criar job: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}

// DELETE /api/jobs?id=JOB_ID  -> apaga um job
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const ids = searchParams.get('ids'); // Suporte a múltiplos IDs: ?ids=id1,id2,id3

    if (ids) {
      const idList = ids.split(',').filter(Boolean);
      await prisma.jobExtra.deleteMany({
        where: { id: { in: idList } },
      });
      return NextResponse.json({ ok: true, count: idList.length });
    }

    if (!id) {
      return NextResponse.json(
        { error: 'Job id ou ids são obrigatórios' },
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
