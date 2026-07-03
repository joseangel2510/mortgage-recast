/**
 * Client island for the recast calculator: read inputs → compare() → render
 * three scenario cards, a verdict, and an SVG balance-over-time chart.
 * State round-trips through the URL hash so results are shareable.
 */
import { compare, type CompareResult, type Loan } from '../lib/amortize';
import { buildChart, type Series } from '../lib/chart';

const $ = <T extends HTMLElement>(sel: string, root: ParentNode = document): T => root.querySelector(sel) as T;

const ids = ['balance', 'rate', 'term-years', 'lump', 'recast-fee', 'refi-rate', 'refi-term', 'refi-costs'] as const;
const el: Record<(typeof ids)[number], HTMLInputElement> = {} as never;
for (const id of ids) el[id] = $(`#${id}`) as unknown as HTMLInputElement;

const hint = $('#tool-hint');
const results = $('#results');

let lastResult: CompareResult | null = null;
let lastHasRefi = false;

const num = (s: string): number => Number(String(s).replace(/[^0-9.]/g, '')) || 0;
const money0 = (n: number): string => '$' + Math.round(n).toLocaleString('en-US');
const COLORS = { recast: '#0b6e8f', extra: '#e8952a', refi: '#55677a' };

function payoffLabel(months: number): string {
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} yr ${m} mo` : `${y} yr`;
}

// ---- money input formatting (thousands separators as you type) -------------
function formatMoneyField(input: HTMLInputElement): void {
  const raw = input.value.replace(/[^0-9]/g, '');
  input.value = raw ? Number(raw).toLocaleString('en-US') : '';
}
for (const id of ['balance', 'lump', 'recast-fee', 'refi-costs'] as const) {
  el[id].addEventListener('input', () => {
    const pos = el[id].value.length - el[id].selectionStart!;
    formatMoneyField(el[id]);
    const p = el[id].value.length - pos;
    el[id].setSelectionRange(p, p);
    update();
  });
}
for (const id of ['rate', 'term-years', 'refi-rate', 'refi-term'] as const) {
  el[id].addEventListener('input', update);
}

// ---------------------------------------------------------------- validation
function readInputs(): { loan: Loan; lump: number; fee: number; refiRate: number; refiTerm: number; refiCosts: number } | string {
  const balance = num(el.balance.value);
  const rate = num(el.rate.value);
  const years = num(el['term-years'].value);
  const lump = num(el.lump.value);
  if (balance <= 0) return 'Enter your current mortgage balance to start.';
  if (rate <= 0 || rate > 25) return 'Enter your interest rate (for example, 6.0).';
  if (years <= 0 || years > 40) return 'Enter how many years are left on your loan (1–40).';
  if (lump <= 0) return 'Enter the lump sum you plan to apply.';
  if (lump >= balance) return 'Your lump sum should be less than your current balance.';
  return {
    loan: { balance, annualRatePct: rate, remainingMonths: Math.round(years * 12) },
    lump,
    fee: num(el['recast-fee'].value),
    refiRate: num(el['refi-rate'].value),
    refiTerm: num(el['refi-term'].value),
    refiCosts: num(el['refi-costs'].value),
  };
}

// ------------------------------------------------------------------- render
function fill(root: HTMLElement, cls: string, text: string): void {
  const n = root.querySelector(cls);
  if (n) n.textContent = text;
}

function render(c: CompareResult, hasRefi: boolean): void {
  $('.stat-original').textContent = money0(c.originalPayment) + ' ';

  $('.verdict-text').textContent = c.verdict.summary;
  const winnerName = { recast: 'Recast', extra: 'Extra principal', refinance: 'Refinance' }[c.verdict.winner];
  $('.verdict-tag').textContent = `Lowest total cost: ${winnerName}`;

  const recastCard = $('.scenario-recast');
  fill(recastCard, '.v-payment', money0(c.recast.newPayment) + '/mo');
  fill(recastCard, '.v-savings', '−' + money0(c.recast.monthlySavings) + '/mo');
  fill(recastCard, '.v-interest', money0(c.recast.totalInterest));
  fill(recastCard, '.v-payoff', payoffLabel(c.recast.payoffMonths));

  const extraCard = $('.scenario-extra');
  fill(extraCard, '.v-payment', money0(c.extra.payment) + '/mo');
  fill(extraCard, '.v-extra', payoffLabel(c.extra.monthsSaved) + ' sooner');
  fill(extraCard, '.v-interest', money0(c.extra.totalInterest));
  fill(extraCard, '.v-payoff', payoffLabel(c.extra.payoffMonths));

  const refiCard = $('.scenario-refi');
  refiCard.hidden = !hasRefi || !c.refinance;
  if (hasRefi && c.refinance) {
    fill(refiCard, '.v-payment', money0(c.refinance.newPayment) + '/mo');
    fill(
      refiCard,
      '.v-savings',
      (c.refinance.monthlySavings >= 0 ? '−' : '+') + money0(Math.abs(c.refinance.monthlySavings)) + '/mo',
    );
    fill(refiCard, '.v-extra', c.refinance.breakEvenMonths ? `${c.refinance.breakEvenMonths} mo` : 'never');
    fill(refiCard, '.v-interest', money0(c.refinance.totalInterest));
  }

  // winner highlight
  for (const card of document.querySelectorAll('.scenario')) card.classList.remove('is-winner');
  const winCard = { recast: '.scenario-recast', extra: '.scenario-extra', refinance: '.scenario-refi' }[c.verdict.winner];
  $(winCard).classList.add('is-winner');

  renderChart(c, hasRefi);
}

function renderChart(c: CompareResult, hasRefi: boolean): void {
  const width = Math.min(720, ($('#chart').clientWidth || 680));
  const series: Series[] = [
    { label: 'Recast', color: COLORS.recast, schedule: c.recast.schedule },
    { label: 'Extra principal', color: COLORS.extra, schedule: c.extra.schedule },
  ];
  if (hasRefi && c.refinance) series.push({ label: 'Refinance', color: COLORS.refi, schedule: c.refinance.schedule });

  const chart = buildChart(series, { width, height: 300 });
  const svgNs = 'http://www.w3.org/2000/svg';
  const parts: string[] = [];
  // grid + y labels
  for (const t of chart.yTicks) {
    parts.push(`<line x1="${chart.plot.x}" y1="${t.y}" x2="${chart.plot.x + chart.plot.w}" y2="${t.y}" stroke="rgba(14,31,46,.09)"/>`);
    parts.push(`<text x="${chart.plot.x - 8}" y="${(t.y ?? 0) + 4}" text-anchor="end" font-size="11" fill="#55677a">${t.label}</text>`);
  }
  for (const t of chart.xTicks) {
    parts.push(`<text x="${t.x}" y="${chart.height - 8}" text-anchor="middle" font-size="11" fill="#55677a">${t.label}</text>`);
  }
  // areas + lines
  chart.series.forEach((s, i) => {
    parts.push(`<path d="${s.area}" fill="${s.color}" opacity="0.07"/>`);
    parts.push(`<path d="${s.d}" fill="none" stroke="${s.color}" stroke-width="${i === 0 ? 3 : 2.4}" stroke-linejoin="round"/>`);
  });
  $('#chart').innerHTML =
    `<svg xmlns="${svgNs}" viewBox="0 0 ${chart.width} ${chart.height}" width="100%" role="img" aria-label="Balance over time for each option">${parts.join('')}</svg>`;

  $('.chart-legend').innerHTML = chart.series
    .map((s) => `<span class="legend-item"><span class="swatch" style="background:${s.color}"></span>${s.label}</span>`)
    .join('');
}

// ------------------------------------------------------------------- update
function update(): void {
  const parsed = readInputs();
  if (typeof parsed === 'string') {
    results.hidden = true;
    hint.hidden = false;
    hint.textContent = parsed;
    return;
  }
  const hasRefi = parsed.refiRate > 0;
  const c = compare({
    loan: parsed.loan,
    lumpSum: parsed.lump,
    recastFee: parsed.fee,
    refiRatePct: parsed.refiRate || undefined,
    refiTermMonths: parsed.refiTerm ? Math.round(parsed.refiTerm * 12) : undefined,
    refiClosingCosts: parsed.refiCosts,
  });
  hint.hidden = true;
  results.hidden = false;
  lastResult = c;
  lastHasRefi = hasRefi;
  render(c, hasRefi);
  writeHash(parsed);
}

// -------------------------------------------------------------- hash state
function writeHash(p: { loan: Loan; lump: number; fee: number; refiRate: number; refiTerm: number; refiCosts: number }): void {
  const params = new URLSearchParams({
    b: String(p.loan.balance),
    r: String(p.loan.annualRatePct),
    y: String(Math.round(p.loan.remainingMonths / 12)),
    l: String(p.lump),
    f: String(p.fee),
  });
  if (p.refiRate) {
    params.set('rr', String(p.refiRate));
    if (p.refiTerm) params.set('rt', String(p.refiTerm));
    if (p.refiCosts) params.set('rc', String(p.refiCosts));
  }
  history.replaceState(null, '', '#' + params.toString());
}

function restoreFromHash(): void {
  const q = new URLSearchParams(location.hash.slice(1));
  const set = (id: (typeof ids)[number], key: string, moneyFmt = false) => {
    const v = q.get(key);
    if (v === null) return;
    el[id].value = moneyFmt ? Number(v).toLocaleString('en-US') : v;
  };
  if ([...q.keys()].length) {
    set('balance', 'b', true);
    set('rate', 'r');
    set('term-years', 'y');
    set('lump', 'l', true);
    set('recast-fee', 'f', true);
    if (q.get('rr')) {
      set('refi-rate', 'rr');
      set('refi-term', 'rt');
      set('refi-costs', 'rc', true);
      ($('.refi-toggle') as unknown as HTMLDetailsElement).open = true;
    }
  }
  update();
}

// ------------------------------------------------------------------ actions
$('#btn-share').addEventListener('click', async () => {
  const url = location.href;
  try {
    await navigator.clipboard.writeText(url);
    const b = $('#btn-share');
    const t = b.textContent;
    b.textContent = '✓ Link copied';
    setTimeout(() => (b.textContent = t), 1600);
  } catch {
    prompt('Copy your shareable link:', url);
  }
});
$('#btn-print').addEventListener('click', () => window.print());

let resizeTimer = 0;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = window.setTimeout(() => {
    if (!results.hidden) renderChartOnly();
  }, 200);
});

// Re-render only the chart on resize (cheap) instead of recomputing everything.
function renderChartOnly(): void {
  if (lastResult) renderChart(lastResult, lastHasRefi);
}

window.addEventListener('hashchange', restoreFromHash);
// Defer the first render past first paint so it doesn't block the critical path.
requestAnimationFrame(restoreFromHash);
