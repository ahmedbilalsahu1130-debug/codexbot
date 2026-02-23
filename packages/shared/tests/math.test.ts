import { describe, expect, it } from 'vitest';
import { ewmaVariance, returns } from '../src/math/indicators';

describe('math', () => {
  it('computes ewma variance', () => {
    const r = returns([100, 101, 102]);
    const v = ewmaVariance(r, 0.9);
    expect(v.length).toBe(2);
    expect(v[1]).toBeGreaterThan(0);
  });
});
