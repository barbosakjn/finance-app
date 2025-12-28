---
description: How to deploy the Finance App to GitHub and Vercel
---

# Deploying Your Finance App

This guide will help you upload your code to GitHub and deploy it to a live URL using Vercel.

## 1. Prepare your Code (Terminal)

First, we need to save your changes to the local git repository.

```bash
# Add all files to staging
git add .

# Commit your changes
git commit -m "Final Polish: Premium UI and Features"
```

## 2. Create a GitHub Repository

1.  Go to [GitHub.com](https://github.com) and log in.
2.  Click the **+** icon in the top right and select **New repository**.
3.  Name it `finance-app` (or whatever you prefer).
4.  Make it **Private** (recommended for personal finance apps).
5.  Click **Create repository**.

## 3. Push Code to GitHub

Copy the commands shown on the GitHub page under "…or push an existing repository from the command line". They will look like this (replace `YOUR_USERNAME` with your actual GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/finance-app.git
git branch -M main
git push -u origin main
```

Run these commands in your terminal.

## 4. Deploy to Vercel (Live URL)

1.  Go to [Vercel.com](https://vercel.com) and sign up/log in with GitHub.
2.  Click **Add New...** > **Project**.
3.  Select your `finance-app` repository from the list (Import).
4.  **Configure Project**:
    *   **Framework Preset**: Next.js (should be auto-detected).
    *   **Environment Variables**:
        *   Add `DATABASE_URL` if you are using a cloud database (e.g., Vercel Postgres, Supabase, or PlanetScale).
        *   *Note: SQLite (`dev.db`) does NOT work on Vercel serverless functions. You will need a cloud database for the live version.*
5.  Click **Deploy**.

## Important Note on Database
Your local app uses SQLite (`dev.db`), which is a file on your computer. Vercel is "serverless", meaning it doesn't keep files permanently.
**To make the app work online, you must switch to a cloud database.**

**Recommended for Free Tier:**
- **Vercel Postgres**: Easy to add directly in the Vercel dashboard.
- **Supabase**: Excellent free tier Postgres.
- **Turso**: Great for SQLite-compatible cloud database.

If you just want to see the UI online, the deployment will succeed, but data persistence might fail until you configure a cloud DB.
