---
description: How to deploy the Finance App to GitHub and Vercel
---

# Deploying Your Finance App (Premium Setup)

This guide covers deploying your app with **Vercel Postgres** (for data) and **Vercel Blob** (for receipt photos).

## 1. Push Code to GitHub

First, ensure your latest code is on GitHub.

```bash
git add .
git commit -m "Setup Vercel Postgres and Blob"
git push
```

## 2. Deploy to Vercel

1.  Go to [Vercel.com](https://vercel.com) and log in.
2.  **Add New Project**: Import your `finance-app` repository.
3.  **Environment Variables**:
    *   Add your `OPENAI_API_KEY`.
    *   Add your `TELEGRAM_BOT_TOKEN`.
    *   Add your `TELEGRAM_WEBHOOK_URL` (This will be your Vercel URL + `/api/telegram`, e.g., `https://finance-app.vercel.app/api/telegram`).
4.  Click **Deploy**.

## 3. Configure Database (Postgres)

1.  In your Vercel Project Dashboard, go to the **Storage** tab.
2.  Click **Create Database** > **Postgres**.
3.  Give it a name (e.g., `finance-db`) and region (e.g., `Washington, D.C.`).
4.  Click **Create**.
5.  **Connect**: Click **Connect Project** and select your `finance-app`.
    *   *This automatically adds `POSTGRES_PRISMA_URL` and other variables to your project.*

## 4. Configure File Storage (Blob)

1.  Still in the **Storage** tab, click **Create Database** (or "Create Store") > **Blob**.
2.  Give it a name (e.g., `finance-images`).
3.  Click **Create**.
4.  **Connect**: Click **Connect Project** and select your `finance-app`.
    *   *This automatically adds `BLOB_READ_WRITE_TOKEN` to your project.*

## 5. Finalize Setup

1.  **Redeploy**: Go to the **Deployments** tab, click the three dots on the latest deployment, and select **Redeploy**. This ensures the new environment variables are picked up.
2.  **Set Telegram Webhook**:
    *   You need to tell Telegram where your bot lives.
    *   Open your browser and visit:
        `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook?url=https://<YOUR_VERCEL_URL>/api/telegram`
    *   Replace `<YOUR_BOT_TOKEN>` and `<YOUR_VERCEL_URL>` with your actual values.

## Troubleshooting
- **Prisma Error**: If you see database errors, you might need to run the migration command in the Vercel Build Settings.
    - Build Command: `npx prisma generate && next build` (Default is usually fine).
    - If tables are missing, you may need to run `npx prisma db push` locally pointing to the production DB, or add it to the build command.
