import { describe, it, expect } from 'vitest';
import {
  monthlyPayment,
  buildSchedule,
  recast,
  extraPrincipal,
  refinance,
  compare,
  type Loan,
} from '../src/lib/amortize';

/**
 * Ground truths from standard amortization math (P = B·i·(1+i)^n / ((1+i)^n − 1),
 * i = annualRatePct/1200). The $300k @ 6% / 30yr = $1,798.65 case is canonical.
 */

describe('monthlyPayment', () => {
  it('canonical $300,000 @ 6% for 360 months = $1,798.65', () => {
    expect(monthlyPayment(300_000, 6, 360)).toBe(1798.65);
  });

  it('zero-interest loan is principal / months', () => {
    // 120000 / 360 = 333.333… → 333.33 per month
    expect(monthlyPayment(120_000, 0, 360)).toBe(333.33);
  });

  it('shorter term means a higher payment', () => {
    expect(monthlyPayment(300_000, 6, 180)).toBeGreaterThan(monthlyPayment(300_000, 6, 360));
  });
});

describe('buildSchedule', () => {
  it('amortizes to a zero balance at the final month', () => {
    const rows = buildSchedule(300_000, 6, 360);
    expect(rows).toHaveLength(360);
    expect(rows[359].balance).toBe(0);
  });

  it('total principal paid equals the starting balance', () => {
    const rows = buildSchedule(250_000, 5.5, 240);
    const principal = rows.reduce((s, r) => s + r.principal, 0);
    expect(principal).toBeCloseTo(250_000, 2);
  });
});

const LOAN: Loan = { balance: 250_000, annualRatePct: 6, remainingMonths: 300 };

describe('recast', () => {
  it('re-amortizes the reduced balance over the SAME remaining term at the SAME rate', () => {
    const r = recast(LOAN, 50_000);
    expect(r.newPayment).toBe(monthlyPayment(200_000, 6, 300));
    expect(r.payoffMonths).toBe(300); // term is unchanged — that's the point of a recast
  });

  it('lowers the monthly payment', () => {
    const original = monthlyPayment(LOAN.balance, LOAN.annualRatePct, LOAN.remainingMonths);
    const r = recast(LOAN, 50_000);
    expect(r.newPayment).toBeLessThan(original);
    expect(r.monthlySavings).toBeCloseTo(original - r.newPayment, 2);
  });
});

describe('extraPrincipal (same lump, no recast)', () => {
  it('keeps the original payment but shortens the term', () => {
    const original = monthlyPayment(LOAN.balance, LOAN.annualRatePct, LOAN.remainingMonths);
    const e = extraPrincipal(LOAN, 50_000);
    expect(e.payment).toBe(original);
    expect(e.payoffMonths).toBeLessThan(LOAN.remainingMonths);
    expect(e.monthsSaved).toBe(LOAN.remainingMonths - e.payoffMonths);
  });
});

describe('the key teaching invariant', () => {
  it('recast costs MORE total interest than the same lump as extra principal', () => {
    const r = recast(LOAN, 50_000);
    const e = extraPrincipal(LOAN, 50_000);
    // Recast keeps the long term (lower payment); extra-principal keeps the high
    // payment and finishes early, so it always pays less lifetime interest.
    expect(r.totalInterest).toBeGreaterThan(e.totalInterest);
  });
});

describe('refinance', () => {
  it('computes break-even months from closing costs and monthly savings', () => {
    // Refi the post-lump balance ($200k) at 4.5% over 300 months, $4,000 costs.
    const currentPayment = monthlyPayment(200_000, 6, 300);
    const rf = refinance(200_000, 4.5, 300, 4_000, currentPayment);
    expect(rf.newPayment).toBe(monthlyPayment(200_000, 4.5, 300));
    expect(rf.monthlySavings).toBeCloseTo(currentPayment - rf.newPayment, 2);
    expect(rf.breakEvenMonths).toBe(Math.ceil(4_000 / rf.monthlySavings));
  });

  it('has no break-even when the new rate is not lower', () => {
    const currentPayment = monthlyPayment(200_000, 6, 300);
    const rf = refinance(200_000, 6.5, 300, 4_000, currentPayment);
    expect(rf.monthlySavings).toBeLessThanOrEqual(0);
    expect(rf.breakEvenMonths).toBeNull();
  });
});

describe('compare', () => {
  it('returns all three scenarios and a verdict key', () => {
    const c = compare({
      loan: LOAN,
      lumpSum: 50_000,
      recastFee: 250,
      refiRatePct: 4.5,
      refiTermMonths: 300,
      refiClosingCosts: 4_000,
    });
    expect(c.recast.newPayment).toBeGreaterThan(0);
    expect(c.extra.payoffMonths).toBeLessThan(300);
    expect(c.refinance?.newPayment).toBeGreaterThan(0);
    expect(['recast', 'extra', 'refinance']).toContain(c.verdict.winner);
    expect(typeof c.verdict.summary).toBe('string');
  });

  it('omits the refinance leg when no refi rate is provided', () => {
    const c = compare({ loan: LOAN, lumpSum: 50_000, recastFee: 250 });
    expect(c.refinance).toBeNull();
  });
});
