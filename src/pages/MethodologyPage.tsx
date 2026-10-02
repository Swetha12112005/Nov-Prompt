import { BookOpen, Database, Calculator, Search, Bot, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { SectionHeader } from '@/components/ui';

export function MethodologyPage() {
  return (
    <div>
      <SectionHeader
        title="Methodology"
        description="How NOVA CART analyzes data, generates signals, and produces recommendations."
      />

      <div className="space-y-4">
        <MethodologyCard
          icon={<Database className="w-4 h-4" />}
          title="Dataset"
          items={[
            'Synthetic demo dataset of 360 orders across 4 zones (A, B, C, D) over 30 days.',
            'Each order includes: zone, order value, delivery time, expected delivery time, cancellation status and reason, rider availability, inventory availability, repeat purchase flag, and peak-hour flag.',
            'Data is designed to produce meaningful operational signals: Zone C has the worst delivery times, peak hours show capacity strain, and late delivery dominates cancellations.',
            'Users can upload their own CSV via the Data Center. All processing is client-side.',
          ]}
        />

        <MethodologyCard
          icon={<Calculator className="w-4 h-4" />}
          title="KPI Calculations"
          items={[
            'Cancellation Rate = (cancelled orders / total orders) × 100',
            'Repeat Purchase Rate = (repeat purchases / delivered orders) × 100 — only non-cancelled orders are counted.',
            'Average Delivery Time = mean delivery_time across non-cancelled orders',
            'On-Time Delivery Rate = (orders delivered within expected time / delivered orders) × 100',
            'Revenue = sum of order_value for non-cancelled orders',
            'Previous-period comparison splits the dataset chronologically and compares the two halves.',
          ]}
        />

        <MethodologyCard
          icon={<Search className="w-4 h-4" />}
          title="Root-Cause Methodology"
          items={[
            'A transparent rule-based engine analyzes zones, peak vs non-peak periods, delivery time, cancellation reasons, rider availability, inventory availability, and repeat purchase patterns.',
            'Each detected signal is presented with: Observation, Evidence, Possible Contributing Factor, Confidence Level, and Recommended Investigation.',
            'Signals are labeled as hypotheses — the application never presents correlation as proven causation.',
            'The causal chain (Demand Growth → Operational Pressure → Delivery Delays → Cancellations → Poor Experience → Lower Repeat Purchases) is explicitly labeled "Analytical Hypothesis — Requires Validation."',
          ]}
        />

        <MethodologyCard
          icon={<Bot className="w-4 h-4" />}
          title="AI Advisor Methodology"
          items={[
            'The AI Business Advisor sends structured KPIs and operational signals to a Supabase Edge Function that proxies Google Gemini AI.',
            'The Gemini model receives the actual metrics and signals — it cannot invent numbers.',
            'Each recommendation includes: Problem, Evidence, Recommended Action, Expected Direction of Impact, Risk/Limitation, and Validation Step.',
            'If the Gemini API key is not configured or the request fails, the system falls back to deterministic rule-based recommendations and clearly labels this.',
            'The advisor never claims to use generative AI when it is using the rule-based fallback.',
          ]}
        />

        <MethodologyCard
          icon={<SlidersHorizontal className="w-4 h-4" />}
          title="Impact Simulator Assumptions"
          items={[
            'Delivery Time Reduction directly reduces delivery time by the specified percentage.',
            'Rider Capacity Improvement indirectly reduces delivery time by 15% of the improvement factor.',
            'Inventory Availability Improvement indirectly reduces delivery time by 10% of the improvement factor.',
            'Cancellation Rate is reduced by 45% of the delivery improvement factor, 20% of rider factor, and 15% of inventory factor.',
            'Repeat Purchase Rate increases proportionally to delivery and cancellation improvements (capped at 85%).',
            'On-Time Delivery Rate increases proportionally to delivery time reduction.',
            'All calculations are deterministic — no random values are used.',
            'Results are labeled "Modeled Impact — Not a guaranteed business outcome."',
          ]}
        />

        <MethodologyCard
          icon={<ShieldCheck className="w-4 h-4" />}
          title="Limitations"
          items={[
            'All data is synthetic. Recommendations are analytical hypotheses, not proven business strategies.',
            'The impact simulator uses simplified linear models. Real-world relationships may be non-linear.',
            'The AI advisor is limited by the quality and completeness of the provided dataset.',
            'Correlation between delivery delays and repeat purchases does not prove causation — a controlled A/B test is recommended to validate.',
            'The demo dataset is small (360 orders). Production analysis would require significantly larger samples.',
          ]}
        />
      </div>
    </div>
  );
}

function MethodologyCard({
  icon,
  title,
  items,
}: {
  icon: React.ReactNode;
  title: string;
  items: string[];
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="text-pink-500">{icon}</div>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
            <span className="text-pink-400 mt-0.5 shrink-0">•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
