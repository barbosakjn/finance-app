
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env manually
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf-8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, ''); // Remove quotes if present
        }
    });
}

const prisma = new PrismaClient();

async function main() {
    const jobs = await prisma.jobExtra.findMany({
        orderBy: { date: 'desc' },
        take: 5
    });
    console.log('Total jobs found (showing last 5):', jobs.length);
    jobs.forEach(j => {
        console.log(`ID: ${j.id}, Date (ISO): ${j.date.toISOString()}, Price: ${j.price}`);
        // Also print local string to see what server thinks
        console.log(`Date (Local): ${j.date.toLocaleString()}`);
    });
}

main()
    .catch(e => console.error(e))
    .finally(async () => {
        await prisma.$disconnect();
    });
