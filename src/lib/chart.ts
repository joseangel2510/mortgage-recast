/**
 * Pure SVG geometry for a balance-over-time line chart. No DOM, no library —
 * returns path `d` strings and tick positions; the caller renders the <svg>.
 */
import type { ScheduleRow } from './amortize';

export interface Series {
  label: string;
  color: string;
  schedule: ScheduleRow[];
}

export interface ChartOptions {
  width: number;
  height: number;
  padding?: { top: number; right: number; bottom: number; left: number };
}

export interface ChartSeries {
  label: string;
  color: string;
  d: string;
  /** Filled area path (line down to the baseline) for a subtle gradient fill. */
  area: string;
}

export interface Tick {
  x?: number;
  y?: number;
  label: string;
}

export interface Chart {
  width: number;
  height: number;
  plot: { x: number; y: number; w: number; h: number };
  series: ChartSeries[];
  xTicks: Tick[];
  yTicks: Tick[];
}

const money = (n: number): string => {
  if (n >= 1000) return '$' + Math.round(n / 1000) + 'k';
  return '$' + Math.round(n);
};

export function buildChart(series: Series[], opts: ChartOptions): Chart {
  const pad = opts.padding ?? { top: 16, right: 16, bottom: 32, left: 52 };
  const plot = {
    x: pad.left,
    y: pad.top,
    w: opts.width - pad.left - pad.right,
    h: opts.height - pad.top - pad.bottom,
  };

  const maxMonths = Math.max(1, ...series.map((s) => s.schedule.length));
  const maxBalance = Math.max(1, ...series.map((s) => (s.schedule[0]?.balance ?? 0) + (s.schedule[0]?.principal ?? 0)));

  const xOf = (month: number): number => plot.x + (month / maxMonths) * plot.w;
  const yOf = (bal: number): number => plot.y + (1 - bal / maxBalance) * plot.h;

  const chartSeries: ChartSeries[] = series.map((s) => {
    // Start at month 0 = full starting balance, then each row's ending balance.
    const start = (s.schedule[0]?.balance ?? 0) + (s.schedule[0]?.principal ?? 0);
    const pts: [number, number][] = [[xOf(0), yOf(start)]];
    for (const r of s.schedule) pts.push([xOf(r.month), yOf(r.balance)]);
    const d = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${round(x)} ${round(y)}`).join(' ');
    const baseline = round(plot.y + plot.h);
    const area = `${d} L${round(pts[pts.length - 1][0])} ${baseline} L${round(pts[0][0])} ${baseline} Z`;
    return { label: s.label, color: s.color, d, area };
  });

  // x ticks every ~5 years
  const maxYears = Math.ceil(maxMonths / 12);
  const yearStep = maxYears > 20 ? 5 : maxYears > 10 ? 2 : 1;
  const xTicks: Tick[] = [];
  for (let yr = 0; yr <= maxYears; yr += yearStep) {
    xTicks.push({ x: round(xOf(yr * 12)), label: `${yr}${yr === maxYears ? ' yr' : ''}` });
  }

  // y ticks: 0, 25, 50, 75, 100%
  const yTicks: Tick[] = [0, 0.25, 0.5, 0.75, 1].map((f) => ({
    y: round(yOf(maxBalance * f)),
    label: money(maxBalance * f),
  }));

  return { width: opts.width, height: opts.height, plot, series: chartSeries, xTicks, yTicks };
}

const round = (n: number): number => Math.round(n * 10) / 10;
