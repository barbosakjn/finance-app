import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

const CATEGORY_MAPPING: Record<string, string> = {
    // Food
    'groceries': 'Food',
    'supermarket': 'Food',
    'food & drink': 'Food',
    'restaurants': 'Food',
    'dining': 'Food',
    'lunch': 'Food',
    'dinner': 'Food',

    // Transportation
    'transport': 'Transportation',
    'uber': 'Transportation',
    'gas': 'Transportation',
    'fuel': 'Transportation',
    'car': 'Transportation',
    'parking': 'Transportation',
    'taxi': 'Transportation',

    // Housing
    'rent': 'Housing',
    'mortgage': 'Housing',
    'utilities': 'Housing',
    'internet': 'Housing',
    'water': 'Housing',
    'electricity': 'Housing',
    'maintenance': 'Housing',

    // Health
    'doctor': 'Health',
    'pharmacy': 'Health',
    'medical': 'Health',
    'gym': 'Health',
    'fitness': 'Health',

    // Entertainment
    'movies': 'Entertainment',
    'netflix': 'Entertainment',
    'spotify': 'Entertainment',
    'games': 'Entertainment',
    'music': 'Entertainment',
    'hobbies': 'Entertainment',

    // Shopping
    'clothing': 'Shopping',
    'electronics': 'Shopping',
    'amazon': 'Shopping',
    'gifts': 'Shopping',

    // Education
    'books': 'Education',
    'courses': 'Education',
    'tuition': 'Education',
    'school': 'Education',

    // Financial
    'investment': 'Financial',
    'savings': 'Financial',
    'bank': 'Financial',
    'fees': 'Financial',
    'tax': 'Financial',
    'insurance': 'Financial',

    // IA STUFF
    'ai': 'IA STUFF',
    'gpt': 'IA STUFF',
    'tech': 'IA STUFF',
    'software': 'IA STUFF'
};

const VALID_CATEGORIES = [
    "Housing", "Transportation", "Food", "Health", "Shopping",
    "Entertainment", "Financial", "Education", "Other", "IA STUFF"
];

export async function POST() {
    try {
        const transactions = await prisma.transaction.findMany();
        let updatedCount = 0;

        for (const t of transactions) {
            const currentCat = t.category || '';

            // If already valid, skip
            if (VALID_CATEGORIES.includes(currentCat)) continue;

            // Try to map
            let newCat = 'Other';
            const lowerCat = currentCat.toLowerCase();

            // Direct mapping
            if (CATEGORY_MAPPING[lowerCat]) {
                newCat = CATEGORY_MAPPING[lowerCat];
            } else {
                // Keyword search
                for (const [key, val] of Object.entries(CATEGORY_MAPPING)) {
                    if (lowerCat.includes(key)) {
                        newCat = val;
                        break;
                    }
                }
            }

            await prisma.transaction.update({
                where: { id: t.id },
                data: { category: newCat }
            });
            updatedCount++;
        }

        return NextResponse.json({ success: true, updated: updatedCount });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ error: 'Migration failed' }, { status: 500 });
    }
}
