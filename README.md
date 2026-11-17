# Yardstick

A Next.js financial data app using Financial Modeling Prep (FMP).

## Basic tier behavior

- The homepage and sector tabs show curated US-listed companies, ranked only within each list. Edit `lib/company-lists.ts` to change the selections.
- FMP company profiles supply the baseline company data. Ratios, earnings, and charts appear only when the current FMP plan provides them for a symbol.
- Market cap charts request up to one month of history. Revenue and earnings charts request up to five quarterly reports. Each chart metric loads only when selected.
- Upstream responses and company lists are cached for one day to conserve FMP's 250-call daily Basic allowance. Popularity, searches, and cold starts can still exhaust that allowance; this app has no global request counter.
- Set `FMP_API_KEY` on the server. The key must never be exposed to client code. Confirm FMP's display and licensing terms before running a public site on a personal plan.

## Development

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add your FMP key to `.env.local`, then visit http://localhost:3000.
