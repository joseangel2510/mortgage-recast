# Design: Mortgage Recast Calculator — Site #2

**Date:** 2026-07-03
**Status:** Approved (site #2 of the 3-site AdSense portfolio; concept chosen from ranked research)
**Goal:** English-language, US-audience static micro-tool site monetized with Google AdSense. Own GitHub repo → Vercel → custom domain. Independent from site #1.

## The product in one sentence

The homeowner enters their mortgage balance, rate, remaining term, and a planned lump sum; the site instantly shows the recast (new lower payment) AND a three-way comparison — **recast vs. the same lump sum as extra principal vs. refinancing** — with an amortization chart and a plain-English verdict.

## Why this idea (from portfolio research)

- Mortgage/home-equity is a top-3 AdSense RPM vertical ($15–40 US RPM). Audience = homeowners with $10k–200k liquid + equity + prime credit = exactly who lenders/HELOC/insurers bid on.
- The "mortgage recast calculator" SERP is mid-weak: no Bankrate/NerdWallet/SmartAsset **calculator** ranks; incumbents show tables only, none does a true 3-way recast/extra-principal/refinance comparison with a chart, none has lender-specific data or shareable scenario URLs.
- Pure amortization math → 100% client-side, free Vercel hosting, zero policy risk (with YMYL disclaimers).
- Recast is the high-rate-era play (2025–26 rates elevated): homeowners with low locked rates who get a lump sum prefer recasting over refinancing. Recurring viral TikTok demand ("the mortgage hack banks don't advertise").

> **Accuracy note:** lender-specific recast fees/minimums and the exact math are being verified by a background research workflow (`wf_602ae707-4dc`) before the engine and lender pages are finalized. A wrong figure here is a YMYL trust problem — lender data will be presented as ranges with "confirm with your servicer" and a last-updated date, sourced.

## Brand (distinct from PaydayCal by design)

- Working name: **RecastWise**. H1 carries the SEO keyword ("Mortgage Recast Calculator").
- Domain candidates (buy later, in order): `recastwise.com`, `recastcalc.com`, `mortgagerecastcalc.com`. Domain-agnostic build (single `SITE_URL`).
- Deliberately different look from site #1: PaydayCal = warm paper, money-green, gold, serif Fraunces. RecastWise = **cool architectural/fintech**: near-white cool background, deep navy ink, a trustworthy blue-teal primary, warm amber accent for the *recommended* option; a modern grotesque display face (NOT Fraunces, NOT Space Grotesk). The amortization **chart is the hero visual** (vs. site #1's calendar grid).

## Architecture (mirrors site #1's proven stack)

- **Astro 5** static output, **vanilla TypeScript** engine + one interactive island, **plain CSS** design tokens. No UI framework, no runtime deps, no APIs, no backend.
- Own GitHub repo `mortgage-recast` (account joseangel2510). Independent Vercel project.
- AdSense gated behind `ADSENSE_CLIENT_ID` (empty until approval); `ads.txt` placeholder.

### Units and boundaries

1. **`src/lib/amortize.ts`** — pure math, no DOM. Monthly payment, full amortization schedule, and the three scenarios:
   - `recast(balance, annualRate, remainingMonths, lumpSum)` → new payment, schedule, total interest.
   - `extraPrincipal(...)` → same payment, shorter term, payoff months, total interest.
   - `refinance(newBalance, newRate, newTermMonths, closingCosts)` → new payment, total interest incl. costs, break-even months.
   - A `compare(...)` that returns all three + the verdict inputs. Unit-tested (Vitest) against hand-computed truths.
2. **`src/lib/chart.ts`** — pure: schedules → SVG path strings for a balance-over-time line chart (no chart library).
3. **`src/lib/lenders.ts`** — verified lender recast dataset (from research), with `lastUpdated` + `source` per entry; feeds programmatic pages and the in-tool "your lender" hint.
4. **`src/components/Tool.astro` + `src/scripts/tool.ts`** — inputs, results (3 scenario cards + verdict), SVG chart, share/print, hash state.
5. **Layouts/components** — `Base.astro` (head/meta/schema/nav/footer/AdSlot), `Article.astro`, `FaqBlock.astro`, `AdSlot.astro` (same pattern as site #1, restyled).

### Pages (URLs)

| URL | Purpose |
|---|---|
| `/` | Tool above the fold + explainer + FAQ (WebApplication + FAQPage schema) |
| `/recast-vs-refinance/` | Guide (high-intent comparison) |
| `/recast-vs-extra-principal/` | Guide (the nuance incumbents skip) |
| `/what-is-a-mortgage-recast/` | Explainer (informational head term) |
| `/is-recasting-worth-it/` | Decision guide |
| `/lenders/{slug}/` | Programmatic: "{Lender} Mortgage Recast: Fee, Minimum & How to Request" (from verified data) |
| `/about/`, `/contact/`, `/privacy-policy/`, `/terms/` | AdSense-required trust pages (with financial-advice disclaimer) |
| `robots.txt`, `sitemap.xml`, `ads.txt`, favicon, og.png | Technical SEO |

### SEO & monetization plumbing

- Per-page title/meta/canonical/OG/Twitter; JSON-LD WebApplication, FAQPage, Article, BreadcrumbList.
- Internal linking: tool ↔ guides ↔ lender pages.
- Ad slots reserved (below result, mid-article, end-article) behind `ADSENSE_CLIENT_ID`.

### Error handling

- Validate inputs (lump sum < balance; rate/term sane ranges; refi rate optional). Friendly messages.
- Warn honestly when extra-principal beats recast on total interest, and when refinance loses because the current rate is below today's rate.
- All math client-side → no network failure modes.

## Testing / verification

- **Vitest** on `amortize.ts`: payment formula vs known values; recast payment recomputation; extra-principal payoff month + interest; refinance break-even; a full schedule's final balance ≈ 0; the "recast has higher lifetime interest than extra-principal" invariant.
- **Playwright** against `astro dev`: fill inputs → assert new payment, three scenario cards, chart renders, verdict text, share URL restore, mobile no-scroll.
- `astro build` clean; sitemap complete; Lighthouse ≥ 95 P/SEO/A11y; JSON-LD validates.

## Out of scope (v1)

PMI removal modeling, ARM/interest-only loans, biweekly, multi-lump-sum schedules, live rate feeds, non-US. Candidates for v1.1 by traffic.

## Portfolio note

Site #3 (Wage Garnishment Calculator) follows after this ships. Research for it preserved from workflow `wf_feec14a7-2ca`.
