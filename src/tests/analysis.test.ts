import { describe, it, expect } from 'vitest';
import { detectOperationalSignals, generateRecommendations } from '@/logic/analysis';
import { calculateModeledImpact } from '@/logic/simulator';
import { demoOrders } from '@/data/demoData';
import type { Order } from '@/types';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    order_id: 'ORD-001',
    customer_id: 'CUST-001',
    zone: 'Zone A',
    order_value: 50,
    order_time: '2026-09-01T12:00:00',
    delivery_time: 30,
    expected_delivery_time: 30,
    cancelled: false,
    cancellation_reason: null,
    rider_available: true,
    inventory_available: true,
    repeat_purchase: false,
    peak_hour: false,
    timestamp: '2026-09-01T12:00:00',
    ...overrides,
  };
}

describe('detectOperationalSignals', () => {
  it('detects signals from demo data', () => {
    const signals = detectOperationalSignals(demoOrders);
    expect(signals.length).toBeGreaterThan(0);
  });

  it('finds zone delivery signal for Zone C', () => {
    const signals = detectOperationalSignals(demoOrders);
    const zoneSignal = signals.find((s) => s.id === 'zone-delivery');
    expect(zoneSignal).toBeDefined();
    expect(zoneSignal!.observation).toContain('Zone C');
  });

  it('finds peak pressure signal', () => {
    const signals = detectOperationalSignals(demoOrders);
    const peakSignal = signals.find((s) => s.id === 'peak-pressure');
    expect(peakSignal).toBeDefined();
  });

  it('returns empty array for empty orders', () => {
    expect(detectOperationalSignals([])).toEqual([]);
  });

  it('each signal has all required fields', () => {
    const signals = detectOperationalSignals(demoOrders);
    for (const s of signals) {
      expect(s.id).toBeTruthy();
      expect(s.observation).toBeTruthy();
      expect(s.evidence).toBeTruthy();
      expect(s.possibleFactor).toBeTruthy();
      expect(s.recommendedInvestigation).toBeTruthy();
      expect(['high', 'medium', 'low']).toContain(s.confidence);
    }
  });
});

describe('generateRecommendations', () => {
  it('generates recommendations from demo data', () => {
    const recs = generateRecommendations(demoOrders);
    expect(recs.length).toBeGreaterThan(0);
  });

  it('returns empty for empty orders', () => {
    expect(generateRecommendations([])).toEqual([]);
  });

  it('each recommendation has all required fields including validationStep', () => {
    const recs = generateRecommendations(demoOrders);
    for (const r of recs) {
      expect(r.id).toBeTruthy();
      expect(r.problem).toBeTruthy();
      expect(r.evidence).toBeTruthy();
      expect(r.recommendedAction).toBeTruthy();
      expect(r.expectedDirection).toBeTruthy();
      expect(r.riskOrLimitation).toBeTruthy();
      expect(r.validationStep).toBeTruthy();
    }
  });
});

describe('calculateModeledImpact', () => {
  it('returns current values when sliders are zero', () => {
    const result = calculateModeledImpact(demoOrders, {
      riderCapacityImprovement: 0,
      inventoryAvailabilityImprovement: 0,
      deliveryTimeReduction: 0,
    });
    expect(result.modeled.cancellationRate).toBe(result.current.cancellationRate);
    expect(result.modeled.averageDeliveryTime).toBe(result.current.averageDeliveryTime);
    expect(result.modeled.repeatPurchaseRate).toBe(result.current.repeatPurchaseRate);
  });

  it('reduces delivery time with delivery improvement slider', () => {
    const result = calculateModeledImpact(demoOrders, {
      riderCapacityImprovement: 0,
      inventoryAvailabilityImprovement: 0,
      deliveryTimeReduction: 20,
    });
    expect(result.modeled.averageDeliveryTime).toBeLessThan(result.current.averageDeliveryTime);
  });

  it('reduces cancellation rate with all improvements', () => {
    const result = calculateModeledImpact(demoOrders, {
      riderCapacityImprovement: 30,
      inventoryAvailabilityImprovement: 30,
      deliveryTimeReduction: 30,
    });
    expect(result.modeled.cancellationRate).toBeLessThan(result.current.cancellationRate);
  });

  it('increases repeat purchase rate with improvements', () => {
    const result = calculateModeledImpact(demoOrders, {
      riderCapacityImprovement: 20,
      inventoryAvailabilityImprovement: 20,
      deliveryTimeReduction: 20,
    });
    expect(result.modeled.repeatPurchaseRate).toBeGreaterThan(result.current.repeatPurchaseRate);
  });

  it('increases on-time delivery rate with improvements', () => {
    const result = calculateModeledImpact(demoOrders, {
      riderCapacityImprovement: 0,
      inventoryAvailabilityImprovement: 0,
      deliveryTimeReduction: 20,
    });
    expect(result.modeled.onTimeDeliveryRate).toBeGreaterThan(result.current.onTimeDeliveryRate);
  });

  it('does not return negative or out-of-bounds values', () => {
    const result = calculateModeledImpact(demoOrders, {
      riderCapacityImprovement: 50,
      inventoryAvailabilityImprovement: 30,
      deliveryTimeReduction: 30,
    });
    expect(result.modeled.cancellationRate).toBeGreaterThanOrEqual(2);
    expect(result.modeled.averageDeliveryTime).toBeGreaterThanOrEqual(15);
    expect(result.modeled.repeatPurchaseRate).toBeLessThanOrEqual(85);
    expect(result.modeled.onTimeDeliveryRate).toBeLessThanOrEqual(100);
  });

  it('is deterministic — same inputs produce same outputs', () => {
    const inputs = { riderCapacityImprovement: 25, inventoryAvailabilityImprovement: 15, deliveryTimeReduction: 10 };
    const result1 = calculateModeledImpact(demoOrders, inputs);
    const result2 = calculateModeledImpact(demoOrders, inputs);
    expect(result1).toEqual(result2);
  });

  it('handles empty orders', () => {
    const result = calculateModeledImpact([], {
      riderCapacityImprovement: 20,
      inventoryAvailabilityImprovement: 20,
      deliveryTimeReduction: 20,
    });
    expect(result.current.totalOrders).toBe(0);
  });
});
