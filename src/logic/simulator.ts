import type { Order, ModeledImpact, SimulatorInputs, KpiMetrics } from '@/types';
import { calculateKpis } from './calculations';

export const SIMULATOR_MODEL_ASSUMPTIONS = [
  'Delivery Time Reduction directly reduces delivery time by the specified percentage.',
  'Rider Capacity Improvement reduces delivery time by 15% of the improvement factor (indirect effect).',
  'Inventory Availability Improvement reduces delivery time by 10% of the improvement factor (indirect effect).',
  'Cancellation Rate is reduced by 45% of the delivery time improvement factor (late delivery cancellations).',
  'Cancellation Rate is reduced by 20% of the rider capacity improvement factor.',
  'Cancellation Rate is reduced by 15% of the inventory availability improvement factor.',
  'Repeat Purchase Rate increases proportionally to delivery and cancellation improvements.',
  'On-Time Delivery Rate increases proportionally to delivery time reduction.',
  'Minimum modeled delivery time is 15 minutes.',
  'Minimum modeled cancellation rate is 2%.',
  'Maximum modeled repeat purchase rate is 85%.',
];

export function calculateModeledImpact(
  orders: Order[],
  inputs: SimulatorInputs
): { current: KpiMetrics; modeled: ModeledImpact } {
  const current = calculateKpis(orders);

  const riderFactor = inputs.riderCapacityImprovement / 100;
  const inventoryFactor = inputs.inventoryAvailabilityImprovement / 100;
  const deliveryFactor = inputs.deliveryTimeReduction / 100;

  const indirectDeliveryReduction =
    current.averageDeliveryTime * riderFactor * 0.15 +
    current.averageDeliveryTime * inventoryFactor * 0.1;
  const totalDeliveryReduction =
    current.averageDeliveryTime * deliveryFactor + indirectDeliveryReduction;
  const modeledDeliveryTime = Math.max(
    15,
    current.averageDeliveryTime - totalDeliveryReduction
  );

  const lateDeliveryImpact = current.cancellationRate * 0.45 * deliveryFactor;
  const riderImpact = current.cancellationRate * 0.2 * riderFactor;
  const inventoryImpact = current.cancellationRate * 0.15 * inventoryFactor;
  const modeledCancellation = Math.max(
    2,
    current.cancellationRate - lateDeliveryImpact - riderImpact - inventoryImpact
  );

  const deliveryImprovementRatio =
    current.averageDeliveryTime > 0
      ? (current.averageDeliveryTime - modeledDeliveryTime) /
        current.averageDeliveryTime
      : 0;
  const cancelImprovementRatio =
    current.cancellationRate > 0
      ? (current.cancellationRate - modeledCancellation) /
        current.cancellationRate
      : 0;
  const repeatUplift =
    deliveryImprovementRatio * 25 + cancelImprovementRatio * 15;
  const modeledRepeat = Math.min(
    85,
    current.repeatPurchaseRate + repeatUplift
  );

  const modeledOnTime = Math.min(
    100,
    current.onTimeDeliveryRate + deliveryImprovementRatio * 30
  );

  return {
    current,
    modeled: {
      cancellationRate: modeledCancellation,
      averageDeliveryTime: modeledDeliveryTime,
      repeatPurchaseRate: modeledRepeat,
      onTimeDeliveryRate: modeledOnTime,
    },
  };
}
