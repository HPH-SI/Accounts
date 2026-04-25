# Accounts — Heritage Park Hotel Invoice Manager

Single-page app for quotations, pro forma invoices, and invoices. Open `HP Invoice Manager.html` in a browser, or host the repo on **Netlify** (the root URL redirects to that file) or **GitHub Pages** (add the same redirect or set the page as your entry in Pages settings if needed).

## Email (Resend)

The app does **not** call `api.resend.com` from the browser. That request is blocked by CORS and shows **“Failed to fetch”**. Email is sent via the Netlify serverless function `netlify/functions/send-email`, which holds the API key on the server.

1. Deploy this site to **Netlify** (include `netlify.toml` and the `netlify/functions` folder).
2. In Netlify: **Site configuration → Environment variables** → add **`RESEND_API_KEY`** with your Resend secret key.
3. Redeploy if needed so the function picks up the variable.

**Optional:** `window.__HPH_EMAIL_SEND_URL__` — set to a full URL (e.g. another backend) that accepts the same JSON body as Resend’s “send email” API and returns the same shape of success/error JSON.

**Opening the HTML as a file (`file://`):** there is no web origin, so the app opens your mail client with a **mailto:** draft instead of calling the API.

**Security:** Never put a Resend API key in `index.html` or any client-side script. If a key was ever committed, **rotate it** in the Resend dashboard.

## Local use

Open `index.html` directly, or run a static server in this folder (recommended for Babel in-browser):

```bash
npx --yes serve .
```

For local testing of **Send** with Resend, use [Netlify CLI](https://docs.netlify.com/cli/get-started/) (`netlify dev`) so `/.netlify/functions/send-email` exists, and set `RESEND_API_KEY` in a local `.env` or Netlify dev context.

## License

Internal use — Heritage Park Hotel (HPH-SI).
