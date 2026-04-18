# Focaccia Co Recipe Lab

A recipe development tool with Chef Matteo — an AI Italian chef consultant — for the Focaccia Co sandwich business. Stores recipes and chef feedback in Supabase, deploys to Vercel.

## Stack

- **Frontend:** React (Vite) + Tailwind CSS
- **Backend:** Vercel Serverless Functions
- **Database:** Supabase (Postgres)
- **AI:** Anthropic API (Claude Sonnet 4)
- **Auth:** Single password gate

## Setup — step by step

### 1. Create the Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → **New project**
2. Name it `focaccia-co`, pick a region close to Ontario (East US 1 is fine)
3. Save the **Project URL** and **service_role key** (Settings → API) — you'll need these in step 4
4. Open the **SQL Editor** and paste the contents of `supabase-setup.sql`, then **Run**

### 2. Get an Anthropic API key

1. Go to [console.anthropic.com](https://console.anthropic.com) → **API Keys** → **Create Key**
2. Save the key starting with `sk-ant-...`

### 3. Push to GitHub

```bash
cd focaccia-co-recipe-lab
git init
git add .
git commit -m "Initial recipe lab"
gh repo create icorsolutions/focaccia-co-recipe-lab --private --source=. --push
```

### 4. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) → import the repo
2. Framework preset: **Vite** (auto-detected)
3. Add these environment variables:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase **service_role** key (not anon) |
   | `ANTHROPIC_API_KEY` | Your `sk-ant-...` key |
   | `APP_PASSWORD` | Whatever password you want to gate access with |

4. Click **Deploy**

### 5. (Optional) Point a subdomain

Add `recipes.icor.solutions` in Vercel → Domains. Add a CNAME record in your DNS pointing to `cname.vercel-dns.com`.

## Local development

```bash
npm install
cp .env.example .env.local  # fill in the same vars as above
npm run dev
```

Note: Vercel Functions run on `vercel dev` — if you want local API routes working:

```bash
npm i -g vercel
vercel dev
```

## Adding staff access later

When you're ready to let staff use the tool:

1. Replace the password gate with Supabase Auth (email/password or magic link)
2. Turn on RLS on the `recipes` table with a policy like `auth.role() = 'authenticated'`
3. Have the browser call Supabase directly (with the anon key) instead of going through `/api/recipes`
4. Keep `/api/chef` server-side since you still don't want the Anthropic key in the browser

The schema won't need to change.

## Notes

- Chef conversation history is stored as a `jsonb` column on each recipe. Simple, flexible, and enough for this scale. If it ever gets heavy (hundreds of exchanges per recipe), break it into a separate `chef_feedback` table.
- The password check is a shared-secret scheme — fine for single-user but not enterprise-grade. Upgrade to real auth before letting staff in.
- `model: claude-sonnet-4-5-20250929` is used in `/api/chef`. Update the model ID when newer versions ship.
