# Accounts — Heritage Park Hotel Invoice Manager

Single-page app for quotations, pro forma invoices, and invoices. Open `index.html` in a browser, or host the repo on **GitHub Pages** or **Netlify**.

## Resend (email)

The app can send mail via the Resend API. Do **not** commit API keys. Before production:

- Deploy with a key injected at build time, or
- Set `window.__HPH_RESEND_KEY__` before the app script runs (e.g. from a private server-side include), or
- **Rotate** any key that was ever committed to a public repository.

## Local use

Open `index.html` directly, or run a static server in this folder (recommended for Babel in-browser):

```bash
npx --yes serve .
```

## License

Internal use — Heritage Park Hotel (HPH-SI).
