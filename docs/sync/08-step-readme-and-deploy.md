# Step 08 — README and Deploy Documentation

## Goal

Add a clear `README.md` at the project root that explains:

- what the app does
- how to run it locally
- how to connect it to Supabase
- how to deploy it (e.g. to Vercel)

This step should only create or update documentation, not change app behavior.

---

## 1. README Content Requirements

Create or update `README.md` with the following sections:

### 1.1 Project Overview

Explain in 2–4 short paragraphs:

- This is a personal daily time logging app (timeline + summary).
- It uses Supabase as the backend (activities + records tables).
- It supports multi-device sync with localStorage as offline fallback.

### 1.2 Tech Stack

List main technologies:

- Vite + React + TypeScript
- Supabase (Postgres + Row Level Security)
- TailwindCSS (if used)
- Any other key tools already present in the project

### 1.3 Getting Started (Local Development)

Include a step-by-step guide:

1. Clone the repo
2. Install dependencies:

   ```bash
   npm install
Create a .env file in the project root with:

bash
Copy code
VITE_SUPABASE_URL=your-supabase-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key
Start the dev server:

bash
Copy code
npm run dev
Explain that the user needs a Supabase project with the required schema (see next section).

1.4 Supabase Setup
Add a brief description of the required database schema (high level, not full SQL):

public.activities:

id uuid primary key

name text

icon text?

color text?

created_at timestamptz

updated_at timestamptz

public.records:

id uuid primary key

activity_id uuid (FK → activities.id)

date date

start_time time

end_time time

remark text?

created_at timestamptz

updated_at timestamptz

Mention that RLS is enabled and anon role has select/insert/update/delete policies for both tables.

You can refer to docs/sync/ for exact SQL if needed, but do not paste full SQL in README.

1.5 Running Lint / Build
Add commands:

bash
Copy code
npm run lint
npm run build
Mention that lint should pass after recent fixes.

2. Deploy Instructions (Vercel)
Add a section: ## Deploying to Vercel explaining:

Build command: npm run build

Output directory: dist

Node / framework: Vite (Vercel usually auto-detects)

Environment variables:

Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Vercel Project Settings → Environment Variables.

After deployment, the app will use the same Supabase backend as local dev.

No need to modify code; just document the process.

3. Non-goals
This step MUST NOT:

change any app behavior or logic

modify existing components or TypeScript code (except adding doc comments if useful)

change Supabase configuration or schema

4. Output
At the end of this step, there should be:

A README.md at the repo root with:

overview

tech stack

local setup

Supabase setup summary

lint/build commands

deploy to Vercel guide

No behavioral changes to the app.