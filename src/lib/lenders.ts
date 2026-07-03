/**
 * Lender recast policies — sourced, July 2026.
 *
 * YMYL SAFETY (see docs/specs): figures vary by loan, investor and state and
 * change over time. NEVER present a single hard fee as guaranteed fact.
 * Every entry carries a `confidence` tier and each page shows a "last verified"
 * date and a "confirm with your servicer" disclaimer.
 */

export const LENDERS_LAST_VERIFIED = 'July 2026';

export type Confidence = 'official' | 'semi-official' | 'reported';
export type Offers = 'yes' | 'no' | 'case-by-case' | 'unknown';

export interface Lender {
  slug: string;
  name: string;
  offers: Offers;
  /** Human-readable fee, expressed as a range or "reported" value — never an unqualified fact. */
  fee: string;
  /** Minimum principal reduction, as published or reported. */
  minimum: string;
  confidence: Confidence;
  notes: string;
  phone?: string;
}

/** Industry-wide norms, safe to state as general guidance. */
export const GENERAL = {
  feeRange: '$0–$500 (most commonly $150–$250; a few large banks are reported fee-free)',
  minimum: 'usually $5,000–$10,000 in principal (some use ~10% of the balance)',
  seasoning: 'typically 2–6 on-time payments before you can recast',
  processing: 'about 30–60 days end to end',
  oneRecast: 'no universal limit, but many servicers cap frequency (e.g., once per 12 months)',
  requestFirst:
    'most servicers require you to submit the recast request/form before or with the lump sum — an unsolicited large principal payment is not automatically a recast',
};

/** Loan-type eligibility — the one area safe to state as general fact (on lenders\' own pages). */
export const ELIGIBILITY = {
  conventional: 'Conventional (Fannie Mae / Freddie Mac) loans are usually eligible, subject to your servicer and investor.',
  government: 'FHA, VA and USDA government loans generally cannot be recast (re-amortization only happens inside a loss-mitigation modification, which is a different process).',
  jumbo: 'Jumbo and portfolio loans vary case by case — only the servicer/investor can confirm.',
  otherIneligible: 'Interest-only loans, Option ARMs and commercial loans are typically ineligible.',
};

export const LENDERS: Lender[] = [
  {
    slug: 'chase',
    name: 'Chase',
    offers: 'yes',
    fee: 'Reported as $0 (Chase\'s page says "no fees or application needed," but disclaims fees may apply) — treat as ~$0–$150, unconfirmed.',
    minimum: 'No fixed minimum stated, though a small paydown won\'t move the payment much; lump sums around $10,000+ are practical.',
    confidence: 'reported',
    notes:
      'Conventional loans only; FHA, VA and USDA explicitly not eligible (stated on Chase\'s own page). No appraisal, credit check or income docs. Availability depends on investor guidelines and Chase can stop offering recasts at any time.',
  },
  {
    slug: 'wells-fargo',
    name: 'Wells Fargo',
    offers: 'yes',
    fee: 'Reported fee-free on Wells Fargo educational content (some older borrower reports mention ~$200) — treat as $0, not a formally published fee.',
    minimum: '$20,000 minimum principal payment cited on Wells Fargo\'s own learn page — higher than most peers.',
    confidence: 'semi-official',
    notes: 'Conventional loans; recalculates principal & interest over the remaining term at the same rate. Government loans not eligible. Process about 4–6 weeks.',
  },
  {
    slug: 'bank-of-america',
    name: 'Bank of America',
    offers: 'yes',
    fee: 'Reported fee-free (from a third-party servicing guide, not a BofA-published fee schedule).',
    minimum: '$5,000 in principal curtailments over the prior ~6 months (reported).',
    confidence: 'reported',
    notes: 'Loan must be current; first 6 months of payments required before eligibility; reported as one recast per rolling 12-month period. Government loans not eligible. Request via customer service.',
  },
  {
    slug: 'rocket-mortgage',
    name: 'Rocket Mortgage',
    offers: 'yes',
    fee: 'Commonly cited up to $250 (industry-standard figure, not a firm published Rocket number).',
    minimum: 'At least $10,000 in principal reduction since closing or your last recast (need not be a single payment).',
    confidence: 'semi-official',
    notes: 'Conventional only; FHA, USDA and VA not eligible (stated on Rocket learn pages). Must have made at least two payments and not be paid ahead.',
  },
  {
    slug: 'mr-cooper',
    name: 'Mr. Cooper (Nationstar)',
    offers: 'yes',
    fee: 'Up to $250, non-refundable (per Mr. Cooper\'s own help center; state-dependent).',
    minimum: '$10,000 minimum principal payment (officially published); curtailment capped around 85% of the current balance.',
    confidence: 'official',
    notes: 'Ineligible: government loans (VA, FHA, GNMA, USDA), plus interest-only, Option ARMs and commercial loans. No credit check. Can take up to 90 days; recently transferred accounts may wait 90 days. Submit the recast form BEFORE paying the lump sum.',
    phone: '833-685-2565',
  },
  {
    slug: 'pennymac',
    name: 'PennyMac',
    offers: 'yes',
    fee: '$250 (officially published in PennyMac\'s FAQ; paid with the principal payment).',
    minimum: '$10,000 minimum lump-sum principal payment (officially published).',
    confidence: 'official',
    notes: 'Re-amortizes the reduced balance over the remaining term at the same rate. Government-backed loans generally not eligible (investor-dependent). Confirm your loan\'s eligibility with PennyMac.',
    phone: '800-777-4001',
  },
  {
    slug: 'us-bank',
    name: 'U.S. Bank',
    offers: 'yes',
    fee: 'A recast/modification fee appears on U.S. Bank\'s servicing fee matrix; the exact amount isn\'t cleanly published (widely cited ~$250). Treat the amount as unconfirmed.',
    minimum: 'Not published; the industry-typical ~$10,000 likely applies — confirm with U.S. Bank.',
    confidence: 'reported',
    notes: 'Offers a "recast modification": a large principal reduction is applied and the balance re-amortized over the remaining term at the same rate. Government loans generally not eligible.',
  },
  {
    slug: 'citizens',
    name: 'Citizens',
    offers: 'yes',
    fee: '$150 recast processing fee (stated on Citizens\' mortgage servicing fees page).',
    minimum: '$5,000 minimum lump-sum principal paydown (per Citizens\' learn page).',
    confidence: 'semi-official',
    notes: 'Re-amortizes the balance over the remaining term; rate and remaining years unchanged. No income or debt verification. Government loans not eligible.',
    phone: '800-234-6002',
  },
  {
    slug: 'newrez',
    name: 'Newrez',
    offers: 'yes',
    fee: '$250 to cover administrative costs (per Newrez documentation; not offered in every state).',
    minimum: '$10,000 OR 10% of the unpaid balance, whichever is greater (per Newrez documentation).',
    confidence: 'official',
    notes: 'Re-amortizes the reduced balance over the remaining term. Government-backed loans generally not eligible (investor-dependent). Processing about 30 days; effective date depends on whether the payment and fee arrive before or after the 15th.',
  },
  {
    slug: 'freedom-mortgage',
    name: 'Freedom Mortgage',
    offers: 'case-by-case',
    fee: 'Not published as a figure; Freedom says recasting "typically comes with a fee" that "can be several hundred dollars." Assume the ~$150–$500 range.',
    minimum: 'Not published; investor/loan-dependent.',
    confidence: 'reported',
    notes: 'Conventional loans only if requirements are met; VA, FHA and USDA explicitly not eligible (stated on Freedom\'s own page). Eligibility is loan/investor-specific.',
    phone: '855-690-5900',
  },
];

export const getLender = (slug: string): Lender | undefined => LENDERS.find((l) => l.slug === slug);
