import { describe, it, expect } from 'vitest';
import {
  calculateCancellationRate,
  calculateRepeatPurchaseRate,
  calculateAverageDeliveryTime,
  calculateOnTimeDeliveryRate,
  calculateRevenue,
  calculateKpis,
  calculateKpiComparison,
  analyzeZones,
  analyzeCancellationReasons,
  analyzeCancellationByZone,
  buildTrendData,
  calculatePeakMetrics,
  analyzeRiderCapacity,
  analyzeInventoryAvailability,
  applyFilters,
} from '@/logic/calculations';
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

const sampleOrders: Order[] = [
  makeOrder({ order_id: '1', cancelled: false, delivery_time: 25, repeat_purchase: true, order_value: 100 }),
  makeOrder({ order_id: '2', cancelled: false, delivery_time: 35, repeat_purchase: false, order_value: 50 }),
  makeOrder({ order_id: '3', cancelled: true, delivery_time: 50, cancellation_reason: 'Late delivery', order_value: 30 }),
  makeOrder({ order_id: '4', cancelled: false, delivery_time: 28, repeat_purchase: true, order_value: 80 }),
  makeOrder({ order_id: '5', cancelled: true, delivery_time: 45, cancellation_reason: 'Out of stock', order_value: 20 }),
];

describe('calculateCancellationRate', () => {
  it('returns 0 for empty array', () => {
    expect(calculateCancellationRate([])).toBe(0);
  });
  it('calculates correct rate', () => {
    expect(calculateCancellationRate(sampleOrders)).toBe(40);
  });
  it('returns 100 when all cancelled', () => {
    expect(calculateCancellationRate([makeOrder({ cancelled: true })])).toBe(100);
  });
  it('returns 0 when no cancellations', () => {
    expect(calculateCancellationRate([makeOrder({ cancelled: false }), makeOrder({ cancelled: false })])).toBe(0);
  });
});

describe('calculateRepeatPurchaseRate', () => {
  it('returns 0 for empty array', () => {
    expect(calculateRepeatPurchaseRate([])).toBe(0);
  });
  it('calculates rate based on delivered orders only', () => {
    expect(calculateRepeatPurchaseRate(sampleOrders)).toBeCloseTo(66.67, 1);
  });
  it('returns 0 when all cancelled', () => {
    expect(calculateRepeatPurchaseRate([makeOrder({ cancelled: true })])).toBe(0);
  });
});

describe('calculateAverageDeliveryTime', () => {
  it('returns 0 for empty array', () => {
    expect(calculateAverageDeliveryTime([])).toBe(0);
  });
  it('calculates average for delivered orders only', () => {
    expect(calculateAverageDeliveryTime(sampleOrders)).toBeCloseTo(29.33, 1);
  });
  it('excludes cancelled orders', () => {
    const orders = [makeOrder({ delivery_time: 20, cancelled: false }), makeOrder({ delivery_time: 100, cancelled: true })];
    expect(calculateAverageDeliveryTime(orders)).toBe(20);
  });
});

describe('calculateOnTimeDeliveryRate', () => {
  it('returns 0 for empty array', () => {
    expect(calculateOnTimeDeliveryRate([])).toBe(0);
  });
  it('calculates on-time percentage', () => {
    const orders = [
      makeOrder({ delivery_time: 25, expected_delivery_time: 30, cancelled: false }),
      makeOrder({ delivery_time: 35, expected_delivery_time: 30, cancelled: false }),
      makeOrder({ delivery_time: 30, expected_delivery_time: 30, cancelled: false }),
      makeOrder({ delivery_time: 40, expected_delivery_time: 30, cancelled: true }),
    ];
    expect(calculateOnTimeDeliveryRate(orders)).toBeCloseTo(66.67, 1);
  });
});

describe('calculateRevenue', () => {
  it('returns 0 for empty array', () => {
    expect(calculateRevenue([])).toBe(0);
  });
  it('sums order_value for non-cancelled orders', () => {
    expect(calculateRevenue(sampleOrders)).toBe(230); // 100 + 50 + 80
  });
  it('excludes cancelled orders', () => {
    expect(calculateRevenue([makeOrder({ order_value: 100, cancelled: true })])).toBe(0);
  });
});

describe('calculateKpis', () => {
  it('returns 0s for empty array', () => {
    const kpis = calculateKpis([]);
    expect(kpis.totalOrders).toBe(0);
    expect(kpis.revenue).toBe(0);
    expect(kpis.cancellationRate).toBe(0);
    expect(kpis.repeatPurchaseRate).toBe(0);
    expect(kpis.averageDeliveryTime).toBe(0);
    expect(kpis.onTimeDeliveryRate).toBe(0);
  });
  it('calculates all KPIs correctly', () => {
    const kpis = calculateKpis(sampleOrders);
    expect(kpis.totalOrders).toBe(5);
    expect(kpis.revenue).toBe(230);
    expect(kpis.cancellationRate).toBe(40);
  });
});

describe('calculateKpiComparison', () => {
  it('returns comparison for empty array', () => {
    const comp = calculateKpiComparison([]);
    expect(comp.current.totalOrders).toBe(0);
    expect(comp.previous.totalOrders).toBe(0);
  });
  it('splits dataset and compares', () => {
    const orders = Array.from({ length: 10 }, (_, i) =>
      makeOrder({ order_id: `ord-${i}`, timestamp: `2026-09-${String(i + 1).padStart(2, '0')}T12:00:00` })
    );
    const comp = calculateKpiComparison(orders);
    expect(comp.current.totalOrders + comp.previous.totalOrders).toBe(10);
    expect(typeof comp.deltas.totalOrders).toBe('number');
  });
});

describe('analyzeZones', () => {
  it('returns empty array for empty orders', () => {
    expect(analyzeZones([])).toEqual([]);
  });
  it('groups by zone and calculates metrics', () => {
    const orders = [
      makeOrder({ zone: 'Zone A', delivery_time: 25, cancelled: false }),
      makeOrder({ zone: 'Zone B', delivery_time: 45, cancelled: true }),
    ];
    const zones = analyzeZones(orders);
    expect(zones).toHaveLength(2);
    expect(zones[0].zone).toBeDefined();
    expect(zones[0].orders).toBeGreaterThan(0);
  });
  it('assigns investigate status for high delivery time', () => {
    const orders = [makeOrder({ zone: 'Zone C', delivery_time: 50, cancelled: false })];
    const zones = analyzeZones(orders);
    expect(zones[0].status).toBe('investigate');
  });
  it('assigns healthy status for good metrics', () => {
    const orders = [makeOrder({ zone: 'Zone A', delivery_time: 20, cancelled: false, rider_available: true, inventory_available: true })];
    const zones = analyzeZones(orders);
    expect(zones[0].status).toBe('healthy');
  });
});

describe('analyzeCancellationReasons', () => {
  it('returns empty for no cancellations', () => {
    expect(analyzeCancellationReasons([makeOrder({ cancelled: false })])).toEqual([]);
  });
  it('groups and sorts by count', () => {
    const orders = [
      makeOrder({ order_id: '1', cancelled: true, cancellation_reason: 'Late delivery' }),
      makeOrder({ order_id: '2', cancelled: true, cancellation_reason: 'Late delivery' }),
      makeOrder({ order_id: '3', cancelled: true, cancellation_reason: 'Out of stock' }),
    ];
    const reasons = analyzeCancellationReasons(orders);
    expect(reasons[0].reason).toBe('Late delivery');
    expect(reasons[0].count).toBe(2);
    expect(reasons[0].percentage).toBeCloseTo(66.67, 1);
  });
});

describe('analyzeCancellationByZone', () => {
  it('returns per-zone cancellation breakdown', () => {
    const orders = [
      makeOrder({ order_id: '1', zone: 'Zone A', cancelled: true, cancellation_reason: 'Late delivery' }),
      makeOrder({ order_id: '2', zone: 'Zone B', cancelled: true, cancellation_reason: 'Out of stock' }),
    ];
    const result = analyzeCancellationByZone(orders);
    expect(result).toHaveLength(2);
    expect(result[0].zone).toBeDefined();
  });
});

describe('buildTrendData', () => {
  it('returns empty for empty orders', () => {
    expect(buildTrendData([])).toEqual([]);
  });
  it('groups by day', () => {
    const orders = [
      makeOrder({ order_id: '1', timestamp: '2026-09-01T12:00:00' }),
      makeOrder({ order_id: '2', timestamp: '2026-09-02T12:00:00' }),
    ];
    const trend = buildTrendData(orders);
    expect(trend).toHaveLength(2);
    expect(trend[0].label).toBeDefined();
  });
});

describe('calculatePeakMetrics', () => {
  it('handles empty orders', () => {
    const peak = calculatePeakMetrics([]);
    expect(peak.peak.orders).toBe(0);
    expect(peak.nonPeak.orders).toBe(0);
  });
  it('separates peak and non-peak', () => {
    const orders = [
      makeOrder({ order_id: '1', peak_hour: true, delivery_time: 40 }),
      makeOrder({ order_id: '2', peak_hour: false, delivery_time: 25 }),
    ];
    const peak = calculatePeakMetrics(orders);
    expect(peak.peak.orders).toBe(1);
    expect(peak.nonPeak.orders).toBe(1);
    expect(peak.peak.avgDeliveryTime).toBe(40);
    expect(peak.nonPeak.avgDeliveryTime).toBe(25);
  });
});

describe('analyzeRiderCapacity', () => {
  it('handles empty orders', () => {
    const r = analyzeRiderCapacity([]);
    expect(r.availableOrders).toBe(0);
    expect(r.unavailableOrders).toBe(0);
  });
  it('separates by rider availability', () => {
    const orders = [
      makeOrder({ order_id: '1', rider_available: true, delivery_time: 25 }),
      makeOrder({ order_id: '2', rider_available: false, delivery_time: 45 }),
    ];
    const r = analyzeRiderCapacity(orders);
    expect(r.availableOrders).toBe(1);
    expect(r.unavailableOrders).toBe(1);
    expect(r.avgDeliveryWhenAvailable).toBe(25);
    expect(r.avgDeliveryWhenUnavailable).toBe(45);
  });
  it('handles zero riders scenario', () => {
    const orders = [makeOrder({ order_id: '1', rider_available: false })];
    const r = analyzeRiderCapacity(orders);
    expect(r.availableOrders).toBe(0);
    expect(r.avgDeliveryWhenAvailable).toBe(0);
  });
});

describe('analyzeInventoryAvailability', () => {
  it('handles empty orders', () => {
    const inv = analyzeInventoryAvailability([]);
    expect(inv.availableOrders).toBe(0);
  });
  it('separates by inventory availability', () => {
    const orders = [
      makeOrder({ order_id: '1', inventory_available: true, cancelled: false }),
      makeOrder({ order_id: '2', inventory_available: false, cancelled: true, cancellation_reason: 'Out of stock' }),
    ];
    const inv = analyzeInventoryAvailability(orders);
    expect(inv.availableOrders).toBe(1);
    expect(inv.unavailableOrders).toBe(1);
  });
});

describe('applyFilters', () => {
  const orders = [
    makeOrder({ order_id: '1', zone: 'Zone A', peak_hour: true, timestamp: '2026-09-01T12:00:00' }),
    makeOrder({ order_id: '2', zone: 'Zone B', peak_hour: false, timestamp: '2026-09-02T12:00:00' }),
  ];

  it('returns all when filters are default', () => {
    expect(applyFilters(orders, { zone: 'all', period: 'all', dateRange: 'all' })).toHaveLength(2);
  });
  it('filters by zone', () => {
    expect(applyFilters(orders, { zone: 'Zone A', period: 'all', dateRange: 'all' })).toHaveLength(1);
  });
  it('filters by peak', () => {
    expect(applyFilters(orders, { zone: 'all', period: 'peak', dateRange: 'all' })).toHaveLength(1);
  });
  it('filters by non-peak', () => {
    expect(applyFilters(orders, { zone: 'all', period: 'non-peak', dateRange: 'all' })).toHaveLength(1);
  });
});
