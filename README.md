[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://vercel.com/ishwari-patils-projects/ticket-ledger)
# The Watchlist Ledger

A portfolio/watchlist tracker styled as a financial ledger, with live prices
in a digital-ticker font and a rolling sparkline per symbol.

## Stack

- React + Vite (frontend)
- A single Vercel serverless function (`/api/quote.js`) that calls the
  [Twelve Data](https://twelvedata.com) API server-side (free tier, no
  card required), so your API key is never exposed in the browser
- Watchlist is saved in `localStorage` — it's per-browser, no account or
  database needed

## Run it locally

```bash
npm install
npm run dev
```

Quotes won't load until you add a Twelve Data key. Get a free one at
[twelvedata.com/pricing](https://twelvedata.com/pricing) (free tier: 800
requests/day, 8/minute — this app polls once every 20s, well within that),
then:

```bash
cp .env.example .env
# edit .env and paste your TWELVEDATA_API_KEY
```

You'll need the [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`,
then `vercel dev`) to run the `/api` function locally — `npm run dev` alone
only serves the frontend.

## Symbol formats

- US stocks: plain ticker, e.g. `AAPL`, `TSLA`
- NSE (India): `SYMBOL.NSE`, e.g. `RELIANCE.NSE`, `INFY.NSE`
- BSE (India): `SYMBOL.BSE`
- If a symbol doesn't resolve, check the exact code on
  [Twelve Data's symbol search](https://twelvedata.com/stocks)

## Deploy

### 1. Push to GitHub

```bash
cd ticker-ledger
git init
git add .
git commit -m "Initial commit: Watchlist Ledger portfolio tracker"
gh repo create ticker-ledger --public --source=. --remote=origin --push
```

(No `gh` CLI? Create an empty repo on github.com named `ticker-ledger`, then:)

```bash
git remote add origin https://github.com/<your-username>/ticker-ledger.git
git branch -M main
git push -u origin main
```

### 2. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the
   `ticker-ledger` GitHub repo.
2. Vercel auto-detects Vite — leave the default build settings.
3. Before deploying, add an environment variable:
   - **Key:** `TWELVEDATA_API_KEY`
   - **Value:** your free key from [twelvedata.com](https://twelvedata.com)
4. Deploy. Your site is live at `https://ticker-ledger.vercel.app`
   (or similar) and `/api/quote` runs as a serverless function automatically.

### Alternative: GitHub Pages

GitHub Pages only serves static files, so it **can't run `/api/quote.js`**.
Deployed there, the ledger UI and localStorage saving still work, but no
live prices will load unless you point the frontend at a serverless
function hosted elsewhere (e.g. this same project's Vercel deployment).

## Notes

- Rate limits: the free Twelve Data tier is 8 requests/minute and 800/day.
  This app makes one request per poll (covering all symbols in one call),
  every 20 seconds — comfortably within that for a personal watchlist.
- Nothing is stored server-side; each request is stateless. Your watchlist
  lives only in your browser's `localStorage`.
