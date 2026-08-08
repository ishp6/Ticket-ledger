[![Live Demo](https://img.shields.io/badge/Live-Demo-green)](https://vercel.com/ishwari-patils-projects/ticket-ledger)
# The Watchlist Ledger

A portfolio/watchlist tracker styled as a financial ledger, with live prices, digital-ticker numbers, and rolling sparklines.

Stack
React + Vite
Vercel Serverless Function (/api/quote.js)
Twelve Data API
localStorage for the watchlist
Run locally
npm install
npm run dev

Add your Twelve Data API key:

cp .env.example .env
TWELVEDATA_API_KEY=your_key_here

To run the Vercel API function locally:

npm i -g vercel
vercel dev

Get a free API key from Twelve Data.

Symbols
US: AAPL, TSLA
NSE: RELIANCE.NSE, INFY.NSE
BSE: SYMBOL.BSE
Deploy
Vercel
Push the project to GitHub.
Import the repo into Vercel.
Add TWELVEDATA_API_KEY under Environment Variables.
Deploy.

Vercel handles both the Vite frontend and /api/quote.js.

GitHub Pages

The frontend and localStorage work, but live prices require /api/quote.js to be hosted separately.

Notes

The free Twelve Data tier has rate limits. This app polls once every 20 seconds and requests all symbols in a single call.
