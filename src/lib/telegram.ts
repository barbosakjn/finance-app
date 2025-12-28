import { Telegraf } from 'telegraf';

const token = process.env.TELEGRAM_BOT_TOKEN || 'dummy_token';

if (!process.env.TELEGRAM_BOT_TOKEN) {
    console.warn('TELEGRAM_BOT_TOKEN is not defined. Bot will not function correctly.');
}

export const bot = new Telegraf(token);
