import { describe, it, expect } from 'vitest';
import { buildChart } from '../src/lib/chart';
import { buildSchedule, extraPrincipal } from '../src/lib/amortize';

describe('buildChart', () => {
  const recastSchedule = buildSchedule(200_000, 6, 300);
  const extra = extraPrincipal({ balance: 250_000, annualRatePct: 6, remainingMonths: 300 }, 50_000);

  const chart = buildChart(
    [
      { label: 'Recast', color: '#0B6E8F', schedule: recastSchedule },
      { label: 'Extra principal', color: '#E8952A', schedule: extra.schedule },
    ],
    { width: 640, height: 320 },
  );

  it('produces one path per series with a valid SVG "d" string', () => {
    expect(chart.series).toHaveLength(2);
    for (const s of chart.series) {
      expect(s.d.startsWith('M')).toBe(true);
      expect(s.d).toContain('L');
    }
  });

  it('keeps all points within the drawable area', () => {
    for (const s of chart.series) {
      const nums = s.d.match(/-?\d+(\.\d+)?/g)!.map(Number);
      for (let k = 0; k < nums.length; k += 2) {
        expect(nums[k]).toBeGreaterThanOrEqual(0);
        expect(nums[k]).toBeLessThanOrEqual(640);
        expect(nums[k + 1]).toBeGreaterThanOrEqual(0);
        expect(nums[k + 1]).toBeLessThanOrEqual(320);
      }
    }
  });

  it('emits year x-ticks and dollar y-ticks', () => {
    expect(chart.xTicks.length).toBeGreaterThan(1);
    expect(chart.yTicks.length).toBeGreaterThan(1);
    expect(chart.xTicks.at(-1)!.label).toMatch(/yr|\d/);
    expect(chart.yTicks[0].label.startsWith('$')).toBe(true);
  });
});
