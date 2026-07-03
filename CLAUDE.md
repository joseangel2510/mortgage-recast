# RecastWise — mortgage-recast

Static Astro 5 site: a homeowner enters balance, rate, remaining term and a lump sum, and instantly sees the recast (new lower payment) plus a three-way comparison — recast vs extra-principal vs refinance — with an amortization chart. Monetized with Google AdSense. Site #2 of a 3-site portfolio (see `../CLAUDE.md`).

## Commands

- `npm run dev` — dev server
- `npm run test` — Vitest unit tests (amortization + scenarios)
- `npm run build` — static build to `dist/`
- `npm run preview` — serve the build

## Hard rules

- Site language: English (US). No backend, no external API calls, no analytics.
- **YMYL accuracy is paramount.** The amortization math must be correct and tested. Lender-specific recast fees/minimums come from `src/lib/lenders.ts`, each with a `source` and `lastUpdated`; present them as ranges with a "confirm with your servicer" disclaimer — never assert a precise fee as fact without a source. A wrong number here is a trust/liability problem.
- Money math: work in integer cents where rounding matters; monthly rate = annualRate/12; document any rounding convention in the code.
- AdSense: gated behind `ADSENSE_CLIENT_ID` in `src/config.ts` (empty until approval). `public/ads.txt` is a placeholder.
- `SITE_URL` in `src/config.ts` is the single source for the domain.
- Every page: unique title ≤ 60 chars, meta description ≤ 155 chars, canonical, OG tags, JSON-LD where supported.
- Distinct brand from PaydayCal (site #1): cool navy/teal/amber fintech look, Schibsted Grotesk + IBM Plex Sans — NOT the warm green/gold/Fraunces of site #1.

## Where things live

- Spec: `docs/specs/2026-07-03-mortgage-recast-design.md`
- Plan: `docs/plans/2026-07-03-mortgage-recast.md`
- Launch guide (Spanish, for owner): `docs/LANZAMIENTO.md`
- Math engine (pure, tested): `src/lib/amortize.ts` · chart SVG: `src/lib/chart.ts` · lender data: `src/lib/lenders.ts`
- Interactive island: `src/scripts/tool.ts` + `src/components/Tool.astro`
