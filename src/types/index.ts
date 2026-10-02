export interface Order {
  order_id: string;
  customer_id: string;
  zone: string;
  order_value: number;
  order_time: string;
  delivery_time: number;
  expected_delivery_time: number;
  cancelled: boolean;
  cancellation_reason: string | null;
  rider_available: boolean;
  inventory_available: boolean;
  repeat_purchase: boolean;
  peak_hour: boolean;
  timestamp: string;
}

export interface KpiMetrics {
  totalOrders: number;
  revenue: number;
  cancellationRate: number;
  repeatPurchaseRate: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
}

export interface KpiComparison {
  current: KpiMetrics;
  previous: KpiMetrics;
  deltas: {
    totalOrders: number;
    revenue: number;
    cancellationRate: number;
    repeatPurchaseRate: number;
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
  };
}

export interface ZonePerformance {
  zone: string;
  orders: number;
  revenue: number;
  averageDeliveryTime: number;
  cancellationRate: number;
  repeatPurchaseRate: number;
  riderUtilization: number;
  riderAvailability: number;
  inventoryAvailability: number;
  onTimeDeliveryRate: number;
  status: 'healthy' | 'watch' | 'investigate';
}

export interface CancellationBreakdown {
  reason: string;
  count: number;
  percentage: number;
}

export interface CancellationByZone {
  zone: string;
  reasons: CancellationBreakdown[];
  totalCancellations: number;
}

export interface TrendPoint {
  label: string;
  orders: number;
  cancellations: number;
  repeatPurchases: number;
  deliveryTime: number;
  revenue: number;
  onTimeRate: number;
}

export interface PeakMetrics {
  peak: PeriodMetrics;
  nonPeak: PeriodMetrics;
}

export interface PeriodMetrics {
  orders: number;
  revenue: number;
  avgDeliveryTime: number;
  cancellationRate: number;
  repeatPurchaseRate: number;
  riderAvailability: number;
  riderUtilization: number;
  inventoryAvailability: number;
  onTimeDeliveryRate: number;
}

export interface RiderAnalysis {
  availableOrders: number;
  unavailableOrders: number;
  avgDeliveryWhenAvailable: number;
  avgDeliveryWhenUnavailable: number;
  cancellationRateWhenAvailable: number;
  cancellationRateWhenUnavailable: number;
}

export interface InventoryAnalysis {
  availableOrders: number;
  unavailableOrders: number;
  avgDeliveryWhenAvailable: number;
  avgDeliveryWhenUnavailable: number;
  cancellationRateWhenAvailable: number;
  cancellationRateWhenUnavailable: number;
}

export type SignalLevel = 'high' | 'medium' | 'low';

export interface RootCauseSignal {
  id: string;
  observation: string;
  evidence: string;
  possibleFactor: string;
  confidence: SignalLevel;
  recommendedInvestigation: string;
}

export interface Recommendation {
  id: string;
  problem: string;
  evidence: string;
  recommendedAction: string;
  expectedDirection: string;
  riskOrLimitation: string;
  validationStep: string;
}

export interface ModeledImpact {
  cancellationRate: number;
  averageDeliveryTime: number;
  repeatPurchaseRate: number;
  onTimeDeliveryRate: number;
}

export interface SimulatorInputs {
  riderCapacityImprovement: number;
  inventoryAvailabilityImprovement: number;
  deliveryTimeReduction: number;
}

export interface DashboardFilters {
  zone: string | 'all';
  period: 'all' | 'peak' | 'non-peak';
  dateRange: 'all' | 'first-half' | 'second-half';
}

export type PageKey =
  | 'overview'
  | 'root-cause'
  | 'operations'
  | 'ai-advisor'
  | 'simulator'
  | 'data-center'
  | 'methodology';

export interface AuthUser {
  email: string;
  id: string;
}
