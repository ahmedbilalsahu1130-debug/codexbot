import { describe, expect, it } from 'vitest';
import { SimulatorService } from '../src/services/simulator/simulator.service';

describe('simulator', () => {
  it('maps leverage', () => {
    const s = new SimulatorService();
    expect(s.calcLeverage(1, 'BREAKOUT')).toBeGreaterThan(0);
  });
});
