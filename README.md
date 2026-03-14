# Prompt Chain Tool

Standalone Next.js app for managing humor flavors and humor flavor steps (CRUD + reorder steps). Access is restricted to users with `profiles.is_superadmin === true` or `profiles.is_matrix_admin === true` in Supabase.

## What it does

- **Flavors & steps:** Create, read, update, delete humor flavors; manage and reorder steps per flavor.
- **Auth:** Google login only; only superadmin or matrix admin can access.
- **Test page:** Pick a flavor and image ID, calls `https://api.almostcrackd.ai/pipeline/generate-captions` with the user’s Supabase session token.
- **UI:** Dark / light / system theme toggle; Flavors list and “Edit & steps” per flavor.

## Stack

- Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, next-themes.
- Supabase for auth (Google OAuth) and data (`humor_flavors`, `humor_flavor_steps`, `profiles`).

## Required environment variables

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key.

No other secrets; same Supabase project as the main caption app and admin.

## Run locally

```bash
cp .env.example .env
# Edit .env and set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (Supabase → Settings → API)
npm install
npm run dev
```

Open http://localhost:3002 and sign in with Google (you must be superadmin or matrix admin).

## Deploy (Vercel)

1. **Add New** → **Project** → Import this repo.
2. **Root Directory:** leave as `.`
3. **Environment variables:** add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Deploy. Optionally turn off **Deployment Protection** in Project Settings for grading or Incognito.

## Matrix admin

If your `profiles` table does not have `is_matrix_admin`, add it in Supabase SQL:

```sql
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_matrix_admin boolean DEFAULT false;
UPDATE profiles SET is_matrix_admin = true WHERE id = 'YOUR_USER_UUID';
```
