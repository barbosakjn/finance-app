import { NextResponse } from 'next/server';
import { handleTelegramWebhook } from '@/lib/telegram/bot';

export async function POST(req: Request) {
    try {
        await handleTelegramWebhook(req);
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Telegram Webhook Error:", error);
        return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
    }
}
