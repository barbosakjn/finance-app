import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { startDate } = body as { startDate: string };

        if (!startDate) {
            return NextResponse.json(
                { error: "startDate é obrigatório" },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        // Garante que o horário não interfira na data (zera horas ou define meio-dia para evitar timezone issues)
        // Vamos usar meio-dia para segurança, igual ao endpoint de jobs
        start.setUTCHours(12, 0, 0, 0);

        const jobsToCreate = [];

        // Gera 15 dias a partir da data de início
        for (let i = 0; i < 15; i++) {
            const current = new Date(start);
            current.setDate(start.getDate() + i);

            // 0 = Domingo, 6 = Sábado. Queremos apenas dias úteis (1 a 5)
            const dayOfWeek = current.getDay();
            if (dayOfWeek >= 1 && dayOfWeek <= 5) {
                // Cria 2 jobs idênticos para o dia
                for (let j = 0; j < 2; j++) {
                    jobsToCreate.push({
                        date: current,
                        pickup: "Mountain View/Timpanogos",
                        delivery: "Ogden Regional - ROUTE",
                        time: "ROUTE",
                        price: 150,
                        // type não existe no schema, é inferido pelo frontend ou contexto
                    });
                }
            }
        }

        if (jobsToCreate.length === 0) {
            return NextResponse.json({
                ok: true,
                message: "Nenhum dia útil encontrado no período (estranho, mas ok).",
                count: 0,
            });
        }

        // Usa createMany para performance
        const result = await prisma.jobExtra.createMany({
            data: jobsToCreate,
        });

        return NextResponse.json({
            ok: true,
            count: result.count,
            message: `${result.count} jobs de rota criados com sucesso.`,
        });
    } catch (error) {
        console.error("Error generating route jobs:", error);
        return NextResponse.json(
            { error: "Erro ao gerar rotas automáticas" },
            { status: 500 }
        );
    }
}
