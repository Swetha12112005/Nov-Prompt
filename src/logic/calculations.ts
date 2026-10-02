import type {
  Order,
  KpiMetrics,
  KpiComparison,
  ZonePerformance,
  CancellationBreakdown,
  CancellationByZone,
  TrendPoint,
  PeakMetrics,
  PeriodMetrics,
  RiderAnalysis,
  InventoryAnalysis,
  DashboardFilters,
} from '@/types';

export function calculateCancellationRate(orders: Order[]): number {
  if (orders.length === 0) return 0;
  const cancelled = orders.filter((o) => o.cancelled).length;
  return (cancelled / orders.length) * 100;
}

export function calculateRepeatPurchaseRate(orders: Order[]): number {
  const delivered = orders.filter((o) => !o.cancelled);
  if (delivered.length === 0) return 0;
  const repeat = delivered.filter((o) => o.repeat_purchase).length;
  return (repeat / delivered.length) * 100;
}

export function calculateAverageDeliveryTime(orders: Order[]): number {
  const delivered = orders.filter((o) => !o.cancelled);
  if (delivered.length === 0) return 0;
  const total = delivered.reduce((sum, o) => sum + o.delivery_time, 0);
  return total / delivered.length;
}

export function calculateOnTimeDeliveryRate(orders: Order[]): number {
  const delivered = orders.filter((o) => !o.cancelled);
  if (delivered.length === 0) return 0;
  const onTime = delivered.filter(
    (o) => o.delivery_time <= o.expected_delivery_time
  ).length;
  return (onTime / delivered.length) * 100;
}

export function calculateRevenue(orders: Order[]): number {
  return orders
    .filter((o) => !o.cancelled)
    .reduce((sum, o) => sum + o.order_value, 0);
}

export function calculateKpis(orders: Order[]): KpiMetrics {
  return {
    totalOrders: orders.length,
    revenue: calculateRevenue(orders),
    cancellationRate: calculateCancellationRate(orders),
    repeatPurchaseRate: calculateRepeatPurchaseRate(orders),
    averageDeliveryTime: calculateAverageDeliveryTime(orders),
    onTimeDeliveryRate: calculateOnTimeDeliveryRate(orders),
  };
}

export function calculateKpiComparison(orders: Order[]): KpiComparison {
  const sorted = [...orders].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );
  const midpoint = Math.floor(sorted.length / 2);
  const previousOrders = sorted.slice(0, midpoint);
  const currentOrders = sorted.slice(midpoint);

  const current = calculateKpis(currentOrders);
  const previous = calculateKpis(previousOrders);

  return {
    current,
    previous,
    deltas: {
      totalOrders: current.totalOrders - previous.totalOrders,
      revenue: current.revenue - previous.revenue,
      cancellationRate: current.cancellationRate - previous.cancellationRate,
      repeatPurchaseRate:
        current.repeatPurchaseRate - previous.repeatPurchaseRate,
      averageDeliveryTime:
        current.averageDeliveryTime - previous.averageDeliveryTime,
      onTimeDeliveryRate:
        current.onTimeDeliveryRate - previous.onTimeDeliveryRate,
    },
  };
}

export function analyzeZones(orders: Order[]): ZonePerformance[] {
  const zoneMap = new Map<string, Order[]>();
  for (const order of orders) {
    if (!zoneMap.has(order.zone)) zoneMap.set(order.zone, []);
    zoneMap.get(order.zone)!.push(order);
  }

  const results: ZonePerformance[] = [];

  for (const [zone, zoneOrders] of zoneMap) {
    const delivered = zoneOrders.filter((o) => !o.cancelled);
    const avgDelivery =
      delivered.length > 0
        ? delivered.reduce((s, o) => s + o.delivery_time, 0) / delivered.length
        : 0;
    const cancelRate = calculateCancellationRate(zoneOrders);
    const riderAvail =
      (zoneOrders.filter((o) => o.rider_available).length /
        Math.max(zoneOrders.length, 1)) *
      100;
    const riderUtil = riderAvail;
    const invAvail =
      (zoneOrders.filter((o) => o.inventory_available).length /
        Math.max(zoneOrders.length, 1)) *
      100;
    const onTime = calculateOnTimeDeliveryRate(zoneOrders);
    const repeatRate = calculateRepeatPurchaseRate(zoneOrders);
    const revenue = calculateRevenue(zoneOrders);

    let status: ZonePerformance['status'] = 'healthy';
    if (avgDelivery > 40 || cancelRate > 12) status = 'investigate';
    else if (
      avgDelivery > 32 ||
      cancelRate > 8 ||
      riderUtil < 75 ||
      invAvail < 85
    )
      status = 'watch';

    results.push({
      zone,
      orders: zoneOrders.length,
      revenue,
      averageDeliveryTime: avgDelivery,
      cancellationRate: cancelRate,
      repeatPurchaseRate: repeatRate,
      riderUtilization: riderUtil,
      riderAvailability: riderAvail,
      inventoryAvailability: invAvail,
      onTimeDeliveryRate: onTime,
      status,
    });
  }

  return results.sort((a, b) => b.averageDeliveryTime - a.averageDeliveryTime);
}

export function analyzeCancellationReasons(
  orders: Order[]
): CancellationBreakdown[] {
  const cancelled = orders.filter((o) => o.cancelled && o.cancellation_reason);
  if (cancelled.length === 0) return [];

  const reasonMap = new Map<string, number>();
  for (const order of cancelled) {
    const reason = order.cancellation_reason!;
    reasonMap.set(reason, (reasonMap.get(reason) ?? 0) + 1);
  }

  const total = cancelled.length;
  return Array.from(reasonMap.entries())
    .map(([reason, count]) => ({
      reason,
      count,
      percentage: (count / total) * 100,
    }))
    .sort((a, b) => b.count - a.count);
}

export function analyzeCancellationByZone(
  orders: Order[]
): CancellationByZone[] {
  const zones = [...new Set(orders.map((o) => o.zone))].sort();
  return zones.map((zone) => {
    const zoneOrders = orders.filter((o) => o.zone === zone);
    const reasons = analyzeCancellationReasons(zoneOrders);
    return {
      zone,
      reasons,
      totalCancellations: zoneOrders.filter((o) => o.cancelled).length,
    };
  });
}

export function buildTrendData(orders: Order[]): TrendPoint[] {
  const sorted = [...orders].sort((a, b) =>
    a.timestamp.localeCompare(b.timestamp)
  );

  const dayMap = new Map<string, Order[]>();
  for (const order of sorted) {
    const day = order.timestamp.slice(0, 10);
    if (!dayMap.has(day)) dayMap.set(day, []);
    dayMap.get(day)!.push(order);
  }

  const points: TrendPoint[] = [];
  for (const [day, dayOrders] of dayMap) {
    const delivered = dayOrders.filter((o) => !o.cancelled);
    const avgDelivery =
      delivered.length > 0
        ? delivered.reduce((s, o) => s + o.delivery_time, 0) / delivered.length
        : 0;
    points.push({
      label: day.slice(5),
      orders: dayOrders.length,
      cancellations: dayOrders.filter((o) => o.cancelled).length,
      repeatPurchases: delivered.filter((o) => o.repeat_purchase).length,
      deliveryTime: Math.round(avgDelivery * 10) / 10,
      revenue: Math.round(calculateRevenue(dayOrders) * 100) / 100,
      onTimeRate: Math.round(calculateOnTimeDeliveryRate(dayOrders) * 10) / 10,
    });
  }

  return points;
}

export function calculatePeakMetrics(orders: Order[]): PeakMetrics {
  const peakOrders = orders.filter((o) => o.peak_hour);
  const nonPeakOrders = orders.filter((o) => !o.peak_hour);

  const buildPeriod = (periodOrders: Order[]): PeriodMetrics => ({
    orders: periodOrders.length,
    revenue: calculateRevenue(periodOrders),
    avgDeliveryTime: calculateAverageDeliveryTime(periodOrders),
    cancellationRate: calculateCancellationRate(periodOrders),
    repeatPurchaseRate: calculateRepeatPurchaseRate(periodOrders),
    riderAvailability:
      periodOrders.length > 0
        ? (periodOrders.filter((o) => o.rider_available).length /
            periodOrders.length) *
          100
        : 0,
    riderUtilization:
      periodOrders.length > 0
        ? (periodOrders.filter((o) => o.rider_available).length /
            periodOrders.length) *
          100
        : 0,
    inventoryAvailability:
      periodOrders.length > 0
        ? (periodOrders.filter((o) => o.inventory_available).length /
            periodOrders.length) *
          100
        : 0,
    onTimeDeliveryRate: calculateOnTimeDeliveryRate(periodOrders),
  });

  return {
    peak: buildPeriod(peakOrders),
    nonPeak: buildPeriod(nonPeakOrders),
  };
}

export function analyzeRiderCapacity(orders: Order[]): RiderAnalysis {
  const available = orders.filter((o) => o.rider_available);
  const unavailable = orders.filter((o) => !o.rider_available);

  return {
    availableOrders: available.length,
    unavailableOrders: unavailable.length,
    avgDeliveryWhenAvailable: calculateAverageDeliveryTime(available),
    avgDeliveryWhenUnavailable: calculateAverageDeliveryTime(unavailable),
    cancellationRateWhenAvailable: calculateCancellationRate(available),
    cancellationRateWhenUnavailable: calculateCancellationRate(unavailable),
  };
}

export function analyzeInventoryAvailability(
  orders: Order[]
): InventoryAnalysis {
  const available = orders.filter((o) => o.inventory_available);
  const unavailable = orders.filter((o) => !o.inventory_available);

  return {
    availableOrders: available.length,
    unavailableOrders: unavailable.length,
    avgDeliveryWhenAvailable: calculateAverageDeliveryTime(available),
    avgDeliveryWhenUnavailable: calculateAverageDeliveryTime(unavailable),
    cancellationRateWhenAvailable: calculateCancellationRate(available),
    cancellationRateWhenUnavailable: calculateCancellationRate(unavailable),
  };
}

export function applyFilters(
  orders: Order[],
  filters: DashboardFilters
): Order[] {
  let filtered = orders;

  if (filters.zone !== 'all') {
    filtered = filtered.filter((o) => o.zone === filters.zone);
  }

  if (filters.period === 'peak') {
    filtered = filtered.filter((o) => o.peak_hour);
  } else if (filters.period === 'non-peak') {
    filtered = filtered.filter((o) => !o.peak_hour);
  }

  if (filters.dateRange !== 'all' && orders.length > 0) {
    const sorted = [...filtered].sort((a, b) =>
      a.timestamp.localeCompare(b.timestamp)
    );
    const midpoint = Math.floor(sorted.length / 2);
    if (filters.dateRange === 'first-half') {
      filtered = sorted.slice(0, midpoint);
    } else {
      filtered = sorted.slice(midpoint);
    }
  }

  return filtered;
}
