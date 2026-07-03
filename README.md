# RecastWise — Mortgage Recast Calculator

Enter your balance, rate, remaining term, and a lump sum; instantly see your new lower payment after a recast, plus a three-way comparison — **recast vs extra principal vs refinance** — with an amortization chart and a plain-English verdict. Lender recast policies (fee, minimum, eligibility) for major US servicers, with sourced confidence tiers.

**Live:** _(deploy pending — Vercel)_

## Stack

- [Astro 5](https://astro.build) static output — 21 pages, one ~4 kB (gzip) island
- Pure-TypeScript amortization engine (`src/lib/amortize.ts`) with 13 Vitest tests; SVG chart geometry (`src/lib/chart.ts`) with 3 tests
- Plain CSS "blueprint fintech" design system (`src/styles/global.css`) — no UI framework
- Playwright end-to-end suite (26 checks) against the production build

## Develop

```bash
npm install
npm run dev       # localhost:4321
npm run test      # vitest unit tests
npm run build     # static build to dist/
npm run preview   # serve dist/
```

## Accuracy / YMYL

The math is standard amortization, verified against research (a recast keeps the rate and payoff date and only lowers the payment; the same lump as extra principal always costs less lifetime interest). Lender-specific figures in `src/lib/lenders.ts` carry a confidence tier and a "last verified" date, and every page tells users to confirm with their servicer. Nothing here is financial advice.

## Monetization plumbing

Ad slots and the AdSense loader are gated behind `ADSENSE_CLIENT_ID` in `src/config.ts` (empty until approval). `public/ads.txt` is a placeholder. The production domain lives in `SITE_URL`.

## Docs

- Spec: `docs/specs/2026-07-03-mortgage-recast-design.md`
- Launch runbook (Spanish): `docs/LANZAMIENTO.md`
