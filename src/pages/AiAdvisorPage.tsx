import { useState, useEffect, useCallback } from 'react';
import { Bot, AlertCircle, Target, TrendingUp, ShieldAlert, CheckCircle, Loader2, Sparkles, RefreshCw } from 'lucide-react';
import type { Order } from '@/types';
import { SectionHeader, LoadingState, ErrorState, EmptyState } from '@/components/ui';
import { fetchAiRecommendations, type AiAdvisorResult } from '@/lib/aiAdvisorService';

interface AiAdvisorProps {
  orders: Order[];
}

export function AiAdvisorPage({ orders }: AiAdvisorProps) {
  const [result, setResult] = useState<AiAdvisorResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecommendations = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchAiRecommendations(orders);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate recommendations.');
    } finally {
      setLoading(false);
    }
  }, [orders]);

  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  return (
    <div>
      <SectionHeader
        title="AI Business Advisor"
        description="Structured recommendations generated from the current dataset. This system does not have access to real NOVA CART company data."
      />

      {/* Status banner */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Bot className="w-5 h-5 text-pink-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-slate-700">
            AI-Assisted Business Advisor
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Recommendations are derived from analysis of the loaded dataset. When Google Gemini AI is configured, the advisor uses it to generate insights. Otherwise, deterministic rule-based recommendations are used. The advisor never invents numbers.
          </p>
          {result && (
            <div className="mt-2 flex items-center gap-2">
              {result.aiPowered ? (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-pink-500" />
                  <span className="text-xs font-medium text-pink-600">{result.message}</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-slate-400" />
                  <span className="text-xs font-medium text-slate-500">{result.message}</span>
                </>
              )}
            </div>
          )}
        </div>
        <button
          onClick={loadRecommendations}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50 transition-colors focus:outline-none focus:ring-2 focus:ring-pink-300"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Content */}
      {loading && <LoadingState message="Analyzing metrics and generating recommendations..." />}

      {error && <ErrorState message={error} />}

      {!loading && !error && result && result.recommendations.length === 0 && (
        <EmptyState message="No recommendations generated. Load more data for analysis." />
      )}

      {!loading && !error && result && result.recommendations.length > 0 && (
        <div className="space-y-4">
          {result.recommendations.map((rec, i) => (
            <div key={rec.id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 py-3 flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-pink-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {i + 1}
                </div>
                <p className="text-sm font-semibold text-white">{rec.problem}</p>
                {result.aiPowered && <Sparkles className="w-3.5 h-3.5 text-pink-400 ml-auto" />}
              </div>
              <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Evidence</p>
                    <p className="text-sm text-slate-700">{rec.evidence}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <Target className="w-4 h-4 text-pink-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Recommended Action</p>
                    <p className="text-sm text-slate-700">{rec.recommendedAction}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Expected Direction of Impact</p>
                    <p className="text-sm text-slate-700">{rec.expectedDirection}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Risk / Limitation</p>
                    <p className="text-sm text-slate-700">{rec.riskOrLimitation}</p>
                  </div>
                </div>
                <div className="flex items-start gap-2 md:col-span-2">
                  <CheckCircle className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-medium text-slate-400 uppercase mb-1">Validation Step</p>
                    <p className="text-sm text-slate-700">{rec.validationStep}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
