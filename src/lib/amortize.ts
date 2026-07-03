/**
 * Mortgage amortization engine — pure functions, no DOM.
 *
 * Standard monthly-payment math: P = B·i·(1+i)^n / ((1+i)^n − 1),
 * where i = annualRatePct / 1200 and n = months. Zero-rate loans are B/n.
 *
 * The three scenarios a homeowner with a lump sum actually chooses between:
 *  - RECAST: pay the lump, keep the SAME remaining term, lender re-amortizes →
 *    lower payment, but the long term means MORE lifetime interest.
 *  - EXTRA PRINCIPAL: pay the lump, keep the SAME (higher) payment → the loan
 *    finishes early with the LEAST lifetime interest.
 *  - REFINANCE: new rate, new term, closing costs → only wins if the rate drops
 *    enough to beat the break-even.
 */

export interface Loan {
  balance: number;
  annualRatePct: number;
  remainingMonths: number;
}

export interface ScheduleRow {
  month: number;
  interest: number;
  principal: number;
  balance: number;
  payment: number;
}

const round2 = (x: number): number => Math.round((x + Number.EPSILON) * 100) / 100;

/** Fixed monthly payment that amortizes `balance` over `months` at `annualRatePct`. */
export function monthlyPayment(balance: number, annualRatePct: number, months: number): number {
  if (months <= 0) return 0;
  const i = annualRatePct / 1200;
  if (i === 0) return round2(balance / months);
  const g = Math.pow(1 + i, months);
  return round2((balance * i * g) / (g - 1));
}

/**
 * Amortize until paid off or `cap` months, whichever first. The final month
 * (or the month a payment would overshoot) pays off the exact remaining balance.
 */
function amortize(balance: number, annualRatePct: number, payment: number, cap: number): ScheduleRow[] {
  const i = annualRatePct / 1200;
  const rows: ScheduleRow[] = [];
  let bal = round2(balance);
  for (let m = 1; m <= cap && bal > 0; m++) {
    const interest = round2(bal * i);
    let principal = round2(payment - interest);
    if (principal >= bal || m === cap) principal = bal; // final / overshoot month
    bal = round2(bal - principal);
    rows.push({ month: m, interest, principal, balance: bal, payment: round2(interest + principal) });
  }
  return rows;
}

/** Full amortization schedule for a fixed-term loan (ends exactly at `months`). */
export function buildSchedule(
  balance: number,
  annualRatePct: number,
  months: number,
  payment?: number,
): ScheduleRow[] {
  const pay = payment ?? monthlyPayment(balance, annualRatePct, months);
  return amortize(balance, annualRatePct, pay, months);
}

const totalInterest = (rows: ScheduleRow[]): number => round2(rows.reduce((s, r) => s + r.interest, 0));

// --------------------------------------------------------------- scenarios

export interface RecastResult {
  newBalance: number;
  newPayment: number;
  monthlySavings: number;
  totalInterest: number;
  payoffMonths: number;
  fee: number;
  schedule: ScheduleRow[];
}

export function recast(loan: Loan, lumpSum: number, fee = 0): RecastResult {
  const newBalance = round2(loan.balance - lumpSum);
  const newPayment = monthlyPayment(newBalance, loan.annualRatePct, loan.remainingMonths);
  const original = monthlyPayment(loan.balance, loan.annualRatePct, loan.remainingMonths);
  const schedule = buildSchedule(newBalance, loan.annualRatePct, loan.remainingMonths);
  return {
    newBalance,
    newPayment,
    monthlySavings: round2(original - newPayment),
    totalInterest: totalInterest(schedule),
    payoffMonths: schedule.length,
    fee,
    schedule,
  };
}

export interface ExtraResult {
  newBalance: number;
  payment: number;
  totalInterest: number;
  payoffMonths: number;
  monthsSaved: number;
  schedule: ScheduleRow[];
}

export function extraPrincipal(loan: Loan, lumpSum: number): ExtraResult {
  const newBalance = round2(loan.balance - lumpSum);
  const payment = monthlyPayment(loan.balance, loan.annualRatePct, loan.remainingMonths); // keep it
  const schedule = amortize(newBalance, loan.annualRatePct, payment, loan.remainingMonths);
  return {
    newBalance,
    payment,
    totalInterest: totalInterest(schedule),
    payoffMonths: schedule.length,
    monthsSaved: loan.remainingMonths - schedule.length,
    schedule,
  };
}

export interface RefiResult {
  newPayment: number;
  monthlySavings: number;
  breakEvenMonths: number | null;
  totalInterest: number;
  closingCosts: number;
  schedule: ScheduleRow[];
}

export function refinance(
  balanceToFinance: number,
  newAnnualRatePct: number,
  newTermMonths: number,
  closingCosts: number,
  currentPayment: number,
): RefiResult {
  const newPayment = monthlyPayment(balanceToFinance, newAnnualRatePct, newTermMonths);
  const monthlySavings = round2(currentPayment - newPayment);
  const schedule = buildSchedule(balanceToFinance, newAnnualRatePct, newTermMonths);
  return {
    newPayment,
    monthlySavings,
    breakEvenMonths: monthlySavings > 0 ? Math.ceil(closingCosts / monthlySavings) : null,
    totalInterest: totalInterest(schedule),
    closingCosts,
    schedule,
  };
}

// ---------------------------------------------------------------- compare

export interface CompareParams {
  loan: Loan;
  lumpSum: number;
  recastFee?: number;
  refiRatePct?: number;
  refiTermMonths?: number;
  refiClosingCosts?: number;
}

export interface Verdict {
  winner: 'recast' | 'extra' | 'refinance';
  summary: string;
}

export interface CompareResult {
  originalPayment: number;
  recast: RecastResult;
  extra: ExtraResult;
  refinance: RefiResult | null;
  verdict: Verdict;
}

const fmtMoney = (n: number): string =>
  '$' + Math.round(n).toLocaleString('en-US');

export function compare(params: CompareParams): CompareResult {
  const { loan, lumpSum, recastFee = 0, refiRatePct, refiTermMonths, refiClosingCosts = 0 } = params;
  const originalPayment = monthlyPayment(loan.balance, loan.annualRatePct, loan.remainingMonths);

  const recastRes = recast(loan, lumpSum, recastFee);
  const extraRes = extraPrincipal(loan, lumpSum);
  const refiRes =
    refiRatePct && refiRatePct > 0
      ? refinance(
          round2(loan.balance - lumpSum),
          refiRatePct,
          refiTermMonths ?? loan.remainingMonths,
          refiClosingCosts,
          originalPayment,
        )
      : null;

  // Total lifetime cost of each path (interest + one-time fees/costs).
  const costs: { key: Verdict['winner']; cost: number }[] = [
    { key: 'recast', cost: recastRes.totalInterest + recastFee },
    { key: 'extra', cost: extraRes.totalInterest },
  ];
  if (refiRes) costs.push({ key: 'refinance', cost: refiRes.totalInterest + refiRes.closingCosts });
  costs.sort((a, b) => a.cost - b.cost);
  const winner = costs[0].key;

  let summary: string;
  if (winner === 'extra') {
    summary =
      `Paying the ${fmtMoney(lumpSum)} as extra principal (and keeping your current payment) costs the least ` +
      `total interest. Recasting lowers your payment to ${fmtMoney(recastRes.newPayment)}/mo, but because you ` +
      `stretch the balance over the full remaining term you pay more interest overall. Choose recast for lower ` +
      `monthly cash flow; choose extra principal to get out of debt cheapest.`;
  } else if (winner === 'recast') {
    summary =
      `Recasting comes out ahead here and also lowers your payment to ${fmtMoney(recastRes.newPayment)}/mo ` +
      `(${fmtMoney(recastRes.monthlySavings)} less). Keep your low locked rate and improve cash flow.`;
  } else {
    summary =
      `Refinancing wins on total cost at this rate — but factor in the ${fmtMoney(refiClosingCosts)} closing ` +
      `costs and a break-even of ${refiRes?.breakEvenMonths ?? 0} months. If you might move or pay off before ` +
      `then, recasting (payment ${fmtMoney(recastRes.newPayment)}/mo, no new loan) is the safer play.`;
  }

  return { originalPayment, recast: recastRes, extra: extraRes, refinance: refiRes, verdict: { winner, summary } };
}
