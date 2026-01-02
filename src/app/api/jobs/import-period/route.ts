import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Importa os jobs de uma quinzena e cria UMA transação de INCOME
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { startDate, endDate } = body as {
            startDate: string;
            endDate: string;
        };

        if (!startDate || !endDate) {
            return NextResponse.json(
                { error: "startDate e endDate são obrigatórios" },
                { status: 400 }
            );
        }

        const start = new Date(startDate);
        const end = new Date(endDate);

        // pega todos os jobs nesse período (usando JobExtra)
        const jobs = await prisma.jobExtra.findMany({
            where: {
                date: {
                    gte: start,
                    lte: end,
                },
            },
        });

        if (jobs.length === 0) {
            return NextResponse.json(
                { error: "Nenhum job encontrado nesse período." },
                { status: 404 }
            );
        }

        const subtotal = jobs.reduce((sum, job) => sum + job.price, 0);
        const operationalCost = subtotal * 0.07;
        const totalNet = subtotal - operationalCost;

        const description = `My Jobs ${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;

        // VERIFICA SE JÁ EXISTE UMA TRANSAÇÃO COM ESSA DESCRIÇÃO
        const existingTransaction = await prisma.transaction.findFirst({
            where: {
                description: description,
                type: "INCOME",
            },
        });

        if (existingTransaction) {
            return NextResponse.json(
                { error: "Essa quinzena já foi importada anteriormente." },
                { status: 409 } // Conflict
            );
        }

        // cria UMA transação de INCOME representando essa quinzena
        const transaction = await prisma.transaction.create({
            data: {
                type: "INCOME",
                amount: totalNet,
                description,
                date: end, // data de pagamento = final da quinzena
                category: "Jobs",
                status: "PAID",
            },
        });

        return NextResponse.json({
            ok: true,
            subtotal,
            operationalCost,
            totalNet,
            transaction,
        });
    } catch (error) {
        console.error("Error importing jobs period:", error);
        return NextResponse.json(
            { error: "Erro ao importar quinzena" },
            { status: 500 }
        );
    }
}
