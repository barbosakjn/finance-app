
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log("Searching for transactions with amounts 4.87 or 38.17...");

    const targets = [4.87, 38.17];

    // Search for exact matches
    const exact = await prisma.transaction.findMany({
        where: {
            amount: { in: targets }
        }
    });

    console.log("--- EXACT MATCHES ---");
    console.log(JSON.stringify(exact, null, 2));

    // Search for close matches (float precision)
    // or negative values
    const loose = await prisma.transaction.findMany({
        where: {
            OR: [
                { amount: { gte: 4.8, lte: 4.9 } },
                { amount: { gte: 38.1, lte: 38.2 } },
                { amount: { gte: -4.9, lte: -4.8 } }, // Check negatives
                { amount: { gte: -38.2, lte: -38.1 } }
            ]
        }
    });

    console.log("--- LOOSE MATCHES (Checking for negatives or rounding) ---");
    console.log(JSON.stringify(loose, null, 2));
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
