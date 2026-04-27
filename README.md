# Accounts — Heritage Park Hotel Invoice Manager

Single-page app for quotations, pro forma invoices, and invoices. Open `HP Invoice Manager.html` in a browser, or host the repo on **Netlify** (the root URL redirects to that file) or **GitHub Pages** (add the same redirect or set the page as your entry in Pages settings if needed).

## Email (Resend)

The app does **not** call `api.resend.com` from the browser. That request is blocked by CORS and shows **“Failed to fetch”**. Email is sent via the Netlify serverless function `netlify/functions/send-email`, which holds the API key on the server.

1. Deploy this site to **Netlify** (include `netlify.toml` and the `netlify/functions` folder).
2. In Netlify: **Site configuration → Environment variables** → add **`RESEND_API_KEY`** (exact name, from the Resend dashboard) with your Resend API key. **Important:** set the variable’s **scopes** to include **Functions** (e.g. “All scopes” or at least “Functions and deploy contexts” — **not** Build-only, or the serverless function will not see the key and will keep reporting that email is not configured).
3. **Deploy** the site again (Deploys → Trigger deploy) after adding or changing the variable so the function is rebuilt with the new environment.

Troubleshooting: if the key is set but the error persists, re-check scopes, confirm you’re editing the correct Netlify site, and that the latest deploy completed. Optional alias **`RESEND_KEY`** is also read by the function if you need a duplicate for tooling that reserves certain names.

**Optional:** `window.__HPH_EMAIL_SEND_URL__` — set to a full URL (e.g. another backend) that accepts the same JSON body as Resend’s “send email” API and returns the same shape of success/error JSON.

**Opening the HTML as a file (`file://`):** there is no web origin, so the app opens your mail client with a **mailto:** draft instead of calling the API.

**Security:** Never put a Resend API key in `index.html` or any client-side script. If a key was ever committed, **rotate it** in the Resend dashboard.

## Supabase (document storage)

Saved documents are stored in **PostgreSQL** via [Supabase](https://supabase.com). The browser uses the **Supabase JavaScript client** with the **anon (public) key** only. **Do not** put the direct `postgresql://…` connection string or the database user password in the app or in git—use the **anon** key from **Project Settings → API** in the Supabase dashboard.

1. In the Supabase SQL editor, run the migration in **`supabase/migrations/20260427000000_documents.sql`** (creates the `documents` table and RLS policies).
2. In Netlify: **Environment variables** (scopes including **Functions**), set:
   - **`SUPABASE_URL`** — e.g. `https://hkjdqiuvltlidwtbghtx.supabase.co` (your project URL).
   - **`SUPABASE_ANON_KEY`** — the **anon public** key (not the `service_role` secret for untrusted public sites; you may tighten RLS/policies later).
3. Redeploy the site. The app loads config from `/.netlify/functions/get-public-config` and syncs the document list. Without these variables, the app stays **local only** (in-memory until refresh).

**Local dev:** use `netlify dev` so both email and public-config functions run; set the same variables in a root `.env` (gitignored) if needed.

## Local use

Open `index.html` directly, or run a static server in this folder (recommended for Babel in-browser):

```bash
npx --yes serve .
```

For local testing of **Send** with Resend, use [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`netlify dev`) so `/.netlify/functions/send-email` exists, and set `RESEND_API_KEY` in a local `.env` or Netlify dev context.

## License

Internal use — Heritage Park Hotel (HPH-SI).
