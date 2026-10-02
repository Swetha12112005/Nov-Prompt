import type { Order, RootCauseSignal, Recommendation } from '@/types';
import {
  analyzeZones,
  analyzeCancellationReasons,
  calculateAverageDeliveryTime,
  calculateCancellationRate,
  calculateOnTimeDeliveryRate,
  calculateRepeatPurchaseRate,
  calculatePeakMetrics,
  analyzeRiderCapacity,
  analyzeInventoryAvailability,
} from './calculations';

export function detectOperationalSignals(orders: Order[]): RootCauseSignal[] {
  if (orders.length === 0) return [];

  const signals: RootCauseSignal[] = [];
  const zones = analyzeZones(orders);
  const reasons = analyzeCancellationReasons(orders);
  const peak = calculatePeakMetrics(orders);
  const rider = analyzeRiderCapacity(orders);
  const inventory = analyzeInventoryAvailability(orders);

  if (zones.length > 0) {
    const worst = zones[0];
    if (worst.averageDeliveryTime > 35) {
      signals.push({
        id: 'zone-delivery',
        observation: `${worst.zone} has the highest average delivery time.`,
        evidence: `${worst.averageDeliveryTime.toFixed(
          1
        )} minute average delivery and ${worst.cancellationRate.toFixed(
          1
        )}% cancellation rate.`,
        possibleFactor: 'Operational capacity pressure in this zone.',
        confidence: worst.averageDeliveryTime > 45 ? 'high' : 'medium',
        recommendedInvestigation: `Review rider allocation and route density in ${worst.zone}.`,
      });
    }
  }

  const lowRiderZone = zones.find((z) => z.riderUtilization < 70);
  if (lowRiderZone) {
    signals.push({
      id: 'rider-availability',
      observation: `${lowRiderZone.zone} has low rider availability.`,
      evidence: `Rider availability at ${lowRiderZone.riderUtilization.toFixed(
        1
      )}% with ${lowRiderZone.cancellationRate.toFixed(1)}% cancellation rate.`,
      possibleFactor: 'Insufficient rider supply during demand peaks.',
      confidence: 'medium',
      recommendedInvestigation: `Compare rider shift schedules against demand patterns in ${lowRiderZone.zone}.`,
    });
  }

  const lowInvZone = zones.find((z) => z.inventoryAvailability < 85);
  if (lowInvZone) {
    signals.push({
      id: 'inventory-availability',
      observation: `${lowInvZone.zone} has low inventory availability.`,
      evidence: `Inventory availability at ${lowInvZone.inventoryAvailability.toFixed(
        1
      )}% contributing to stock-out cancellations.`,
      possibleFactor: 'Inventory replenishment not matching demand velocity.',
      confidence: 'medium',
      recommendedInvestigation: `Audit stock levels and reorder thresholds for high-SKU items in ${lowInvZone.zone}.`,
    });
  }

  if (peak.peak.avgDeliveryTime > peak.nonPeak.avgDeliveryTime + 8) {
    signals.push({
      id: 'peak-pressure',
      observation: 'Peak hours show significantly longer delivery times.',
      evidence: `Peak avg ${peak.peak.avgDeliveryTime.toFixed(
        1
      )} min vs non-peak ${peak.nonPeak.avgDeliveryTime.toFixed(
        1
      )} min; peak cancellation ${peak.peak.cancellationRate.toFixed(1)}%.`,
      possibleFactor: 'Demand outstrips rider capacity during peak windows.',
      confidence: 'high',
      recommendedInvestigation:
        'Analyze hourly order volume vs active riders to find capacity gaps.',
    });
  }

  if (reasons.length > 0 && reasons[0].percentage > 35) {
    signals.push({
      id: 'cancellation-dominance',
      observation: `"${reasons[0].reason}" is the dominant cancellation reason.`,
      evidence: `${reasons[0].count} cancellations (${reasons[0].percentage.toFixed(
        1
      )}% of all cancellations).`,
      possibleFactor:
        reasons[0].reason === 'Late delivery'
          ? 'Delivery delays are the primary driver of cancellations.'
          : 'A specific operational failure is driving most cancellations.',
      confidence: 'high',
      recommendedInvestigation: `Focus improvement efforts on the "${reasons[0].reason}" root issue first.`,
    });
  }

  const fastDeliveries = orders.filter(
    (o) => !o.cancelled && o.delivery_time <= o.expected_delivery_time
  );
  const slowDeliveries = orders.filter(
    (o) => !o.cancelled && o.delivery_time > o.expected_delivery_time * 1.4
  );
  const fastRepeat = calculateRepeatPurchaseRate(fastDeliveries);
  const slowRepeat = calculateRepeatPurchaseRate(slowDeliveries);
  if (slowRepeat < fastRepeat - 15 && slowDeliveries.length > 10) {
    signals.push({
      id: 'repeat-correlation',
      observation: 'Repeat purchase rate drops sharply for delayed deliveries.',
      evidence: `On-time deliveries: ${fastRepeat.toFixed(
        1
      )}% repeat. Delayed deliveries: ${slowRepeat.toFixed(1)}% repeat.`,
      possibleFactor:
        'Delivery delays erode customer satisfaction, reducing repeat orders.',
      confidence: 'high',
      recommendedInvestigation:
        'Validate correlation with a controlled A/B test on delivery SLAs.',
    });
  }

  if (
    rider.avgDeliveryWhenUnavailable >
    rider.avgDeliveryWhenAvailable + 8
  ) {
    signals.push({
      id: 'rider-impact',
      observation: 'Orders without rider availability have longer delivery times.',
      evidence: `Avg delivery ${rider.avgDeliveryWhenUnavailable.toFixed(
        1
      )} min without rider vs ${rider.avgDeliveryWhenAvailable.toFixed(
        1
      )} min with rider.`,
      possibleFactor: 'Rider unavailability directly increases delivery delays.',
      confidence: 'medium',
      recommendedInvestigation:
        'Correlate rider unavailability with peak demand windows by zone.',
    });
  }

  if (
    inventory.cancellationRateWhenUnavailable >
    inventory.cancellationRateWhenAvailable + 10
  ) {
    signals.push({
      id: 'inventory-impact',
      observation: 'Orders with inventory unavailability have higher cancellation rates.',
      evidence: `Cancel rate ${inventory.cancellationRateWhenUnavailable.toFixed(
        1
      )}% without inventory vs ${inventory.cancellationRateWhenAvailable.toFixed(
        1
      )}% with inventory.`,
      possibleFactor: 'Stock-outs are a direct driver of cancellations.',
      confidence: 'medium',
      recommendedInvestigation:
        'Audit inventory reorder thresholds against demand patterns.',
    });
  }

  return signals;
}

export function generateRecommendations(orders: Order[]): Recommendation[] {
  if (orders.length === 0) return [];

  const zones = analyzeZones(orders);
  const reasons = analyzeCancellationReasons(orders);
  const avgDelivery = calculateAverageDeliveryTime(orders);
  const cancelRate = calculateCancellationRate(orders);
  const onTimeRate = calculateOnTimeDeliveryRate(orders);
  const repeatRate = calculateRepeatPurchaseRate(orders);
  const peak = calculatePeakMetrics(orders);

  const recs: Recommendation[] = [];

  if (reasons[0]?.reason === 'Late delivery' && reasons[0].percentage > 30) {
    recs.push({
      id: 'rec-rider-capacity',
      problem: 'High cancellation during delayed deliveries.',
      evidence: `Late delivery is the largest cancellation category (${reasons[0].percentage.toFixed(
        1
      )}% of all cancellations).`,
      recommendedAction:
        'Investigate peak-hour rider capacity by zone and add surge-period riders.',
      expectedDirection: 'Lower delivery delays and cancellations.',
      riskOrLimitation:
        'The recommendation requires validation using operational data.',
      validationStep:
        'Run a 2-week pilot with additional riders in the worst-performing zone and measure cancellation changes.',
    });
  }

  if (zones.length > 1) {
    const worst = zones[0];
    const best = zones[zones.length - 1];
    if (worst.averageDeliveryTime - best.averageDeliveryTime > 10) {
      recs.push({
        id: 'rec-zone-rebalance',
        problem: 'Significant delivery-time disparity between zones.',
        evidence: `${worst.zone} averages ${worst.averageDeliveryTime.toFixed(
          1
        )} min vs ${best.zone} at ${best.averageDeliveryTime.toFixed(1)} min.`,
        recommendedAction: `Reallocate riders and optimize dispatch routing toward ${worst.zone}.`,
        expectedDirection:
          'Reduced delivery time variance and lower zone-specific cancellations.',
        riskOrLimitation:
          'Rebalancing may temporarily reduce capacity in currently healthy zones.',
        validationStep:
          'Model rider reallocation impact on all zones before implementation.',
      });
    }
  }

  if (peak.peak.avgDeliveryTime > peak.nonPeak.avgDeliveryTime + 8) {
    recs.push({
      id: 'rec-peak-surge',
      problem: 'Peak-hour delivery times are significantly elevated.',
      evidence: `Peak hours average ${peak.peak.avgDeliveryTime.toFixed(
        1
      )} min vs ${peak.nonPeak.avgDeliveryTime.toFixed(1)} min non-peak.`,
      recommendedAction:
        'Implement dynamic rider surge pricing or incentives during peak windows.',
      expectedDirection:
        'Shorter peak-hour delivery times and fewer peak cancellations.',
      riskOrLimitation:
        'Surge incentives increase unit economics cost per order.',
      validationStep:
        'Pilot surge incentives in one zone for 1 week and measure delivery time impact.',
    });
  }

  if (repeatRate < 40) {
    recs.push({
      id: 'rec-repeat-loyalty',
      problem: 'Repeat purchase rate is below healthy threshold.',
      evidence: `Current repeat purchase rate is ${repeatRate.toFixed(
        1
      )}% with ${cancelRate.toFixed(1)}% cancellation rate.`,
      recommendedAction:
        'Launch a targeted loyalty program for customers with on-time deliveries.',
      expectedDirection: 'Higher repeat purchase rate among satisfied customers.',
      riskOrLimitation:
        'Loyalty programs require careful unit-economics modeling to avoid margin erosion.',
      validationStep:
        'A/B test the loyalty program with a 10% customer sample before full rollout.',
    });
  }

  const lowInvZone = zones.find((z) => z.inventoryAvailability < 85);
  if (lowInvZone) {
    recs.push({
      id: 'rec-inventory',
      problem: `Inventory stock-outs in ${lowInvZone.zone}.`,
      evidence: `Inventory availability at ${lowInvZone.inventoryAvailability.toFixed(
        1
      )}% in ${lowInvZone.zone}.`,
      recommendedAction:
        'Increase reorder thresholds for top-selling SKUs in affected zones.',
      expectedDirection: 'Fewer stock-out cancellations and higher fulfillment rate.',
      riskOrLimitation:
        'Higher inventory holding costs; validate demand forecasts first.',
      validationStep:
        'Audit demand forecasts for top 20 SKUs in the affected zone before adjusting thresholds.',
    });
  }

  if (onTimeRate < 60) {
    recs.push({
      id: 'rec-sla',
      problem: 'On-time delivery rate is below target.',
      evidence: `Only ${onTimeRate.toFixed(
        1
      )}% of orders delivered within expected time at ${avgDelivery.toFixed(1)} min average.`,
      recommendedAction:
        'Set a 30-minute delivery SLA with real-time monitoring and escalation alerts.',
      expectedDirection: 'Improved delivery reliability and customer trust.',
      riskOrLimitation:
        'Tighter SLAs may require additional rider headcount or zone densification.',
      validationStep:
        'Measure current SLA breach rate and model the rider headcount needed to meet the new SLA.',
    });
  }

  return recs;
}

export const causalChain = [
  { label: 'Demand Growth', description: 'Orders and revenue increasing' },
  { label: 'Operational Pressure', description: 'Rider and inventory strain' },
  { label: 'Delivery Delays', description: 'Average delivery time rising' },
  { label: 'Cancellation Signals', description: 'Customers cancelling late orders' },
  { label: 'Poor Customer Experience', description: 'Satisfaction declining' },
  { label: 'Lower Repeat Purchases', description: 'Fewer returning customers' },
];
