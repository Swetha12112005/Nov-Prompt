import type { Order } from '@/types';

const zones = ['Zone A', 'Zone B', 'Zone C', 'Zone D'];
const cancellationReasons = [
  'Late delivery',
  'Out of stock',
  'Customer changed mind',
  'Rider unavailable',
  'Payment failure',
  'Address issue',
];

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

const rng = seededRandom(42);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function generateOrder(i: number): Order {
  const zone = pick(zones);
  const peakHour = rng() > 0.6;

  let baseDelivery = 20 + rng() * 15;
  if (zone === 'Zone C') baseDelivery += 18 + rng() * 12;
  if (zone === 'Zone D') baseDelivery += 8 + rng() * 8;
  if (peakHour) baseDelivery += 10 + rng() * 8;

  const riderAvailable = rng() > (peakHour ? 0.35 : 0.12);
  const inventoryAvailable = rng() > (zone === 'Zone C' ? 0.22 : 0.1);

  if (!riderAvailable) baseDelivery += 8 + rng() * 6;
  if (!inventoryAvailable) baseDelivery += 5 + rng() * 5;

  const expectedDelivery = 30;
  const deliveryTime = Math.round(baseDelivery * 10) / 10;

  let cancelled = false;
  let cancellationReason: string | null = null;

  const lateDelivery = deliveryTime > expectedDelivery * 1.4;
  if (lateDelivery && rng() > 0.55) {
    cancelled = true;
    cancellationReason = 'Late delivery';
  } else if (!inventoryAvailable && rng() > 0.6) {
    cancelled = true;
    cancellationReason = 'Out of stock';
  } else if (!riderAvailable && rng() > 0.7) {
    cancelled = true;
    cancellationReason = 'Rider unavailable';
  } else if (rng() > 0.93) {
    cancelled = true;
    cancellationReason = pick(cancellationReasons.slice(2));
  }

  const orderValue = Math.round((15 + rng() * 85) * 100) / 100;

  let repeatPurchase = false;
  if (!cancelled) {
    if (deliveryTime <= expectedDelivery * 1.1 && rng() > 0.4) {
      repeatPurchase = true;
    } else if (deliveryTime <= expectedDelivery * 1.3 && rng() > 0.6) {
      repeatPurchase = true;
    } else if (rng() > 0.8) {
      repeatPurchase = true;
    }
  }

  const day = Math.floor(i / 12) + 1;
  const hour = 8 + (i % 12);
  const date = `2026-09-${String(day).padStart(2, '0')}`;
  const timestamp = `${date}T${String(hour).padStart(2, '0')}:00:00`;

  return {
    order_id: `ORD-${String(i + 1).padStart(5, '0')}`,
    customer_id: `CUST-${String((i % 200) + 1).padStart(4, '0')}`,
    zone,
    order_value: orderValue,
    order_time: timestamp,
    delivery_time: deliveryTime,
    expected_delivery_time: expectedDelivery,
    cancelled,
    cancellation_reason: cancellationReason,
    rider_available: riderAvailable,
    inventory_available: inventoryAvailable,
    repeat_purchase: cancelled ? false : repeatPurchase,
    peak_hour: peakHour,
    timestamp,
  };
}

export const demoOrders: Order[] = Array.from({ length: 360 }, (_, i) =>
  generateOrder(i)
);

export const csvHeaders = [
  'order_id',
  'customer_id',
  'zone',
  'order_value',
  'order_time',
  'delivery_time',
  'expected_delivery_time',
  'cancelled',
  'cancellation_reason',
  'rider_available',
  'inventory_available',
  'repeat_purchase',
  'peak_hour',
  'timestamp',
];

export function generateSampleCsv(): string {
  const header = csvHeaders.join(',');
  const rows = demoOrders.map((o) =>
    [
      o.order_id,
      o.customer_id,
      o.zone,
      o.order_value,
      o.order_time,
      o.delivery_time,
      o.expected_delivery_time,
      o.cancelled,
      o.cancellation_reason ?? '',
      o.rider_available,
      o.inventory_available,
      o.repeat_purchase,
      o.peak_hour,
      o.timestamp,
    ].join(',')
  );
  return [header, ...rows].join('\n');
}
