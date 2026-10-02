import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SignalData {
  observation: string;
  evidence: string;
  possibleFactor: string;
  confidence: string;
  recommendedInvestigation: string;
}

interface RequestBody {
  kpis: {
    totalOrders: number;
    revenue: number;
    cancellationRate: number;
    repeatPurchaseRate: number;
    averageDeliveryTime: number;
    onTimeDeliveryRate: number;
  };
  signals: SignalData[];
  zoneSummary: string;
  peakSummary: string;
  cancellationReasons: string;
}

const SYSTEM_PROMPT = `You are an AI business operations advisor for NOVA CART, a quick-commerce platform.
Analyze the provided business metrics and operational signals.
Generate 3-5 actionable recommendations.

Each recommendation MUST be a JSON object with these exact fields:
- "problem": A concise problem statement
- "evidence": Specific data evidence from the provided metrics
- "recommendedAction": A concrete action to take
- "expectedDirection": The expected direction of impact (e.g., "Lower delivery delays and cancellations")
- "riskOrLimitation": A risk or limitation of the recommendation
- "validationStep": How to validate this recommendation before full rollout

Rules:
- Use ONLY the data provided. Do NOT invent numbers or metrics.
- Do NOT claim causation where only correlation exists.
- Be specific and actionable.
- Return a JSON array of recommendation objects.
- Do not include any text outside the JSON array.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const body: RequestBody = await req.json();

    const userPrompt = `Business Metrics:
- Total Orders: ${body.kpis.totalOrders}
- Revenue: $${body.kpis.revenue.toFixed(0)}
- Cancellation Rate: ${body.kpis.cancellationRate.toFixed(1)}%
- Repeat Purchase Rate: ${body.kpis.repeatPurchaseRate.toFixed(1)}%
- Average Delivery Time: ${body.kpis.averageDeliveryTime.toFixed(1)} min
- On-Time Delivery Rate: ${body.kpis.onTimeDeliveryRate.toFixed(1)}%

Zone Summary: ${body.zoneSummary}

Peak vs Non-Peak: ${body.peakSummary}

Top Cancellation Reasons: ${body.cancellationReasons}

Operational Signals Detected:
${body.signals.map((s, i) => `${i + 1}. ${s.observation} — Evidence: ${s.evidence} — Factor: ${s.possibleFactor} — Confidence: ${s.confidence}`).join('\n')}

Generate recommendations based on this data. Return a JSON array.`;

    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');

    if (!geminiApiKey) {
      // No API key configured — return a clear message so the frontend can fall back
      return new Response(
        JSON.stringify({
          aiPowered: false,
          message: 'Google Gemini API key not configured. Using rule-based recommendations.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`;

    const geminiResponse = await fetch(geminiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: SYSTEM_PROMPT },
              { text: userPrompt },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 2048,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      return new Response(
        JSON.stringify({
          aiPowered: false,
          message: 'Google Gemini API request failed. Using rule-based recommendations.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const geminiData = await geminiResponse.json();
    const textContent = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textContent) {
      return new Response(
        JSON.stringify({
          aiPowered: false,
          message: 'Google Gemini returned no content. Using rule-based recommendations.',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    let recommendations;
    try {
      recommendations = JSON.parse(textContent);
    } catch {
      // Try to extract JSON array from the text
      const jsonMatch = textContent.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        recommendations = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Could not parse recommendations from Gemini response');
      }
    }

    return new Response(
      JSON.stringify({
        aiPowered: true,
        recommendations,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err) {
    console.error('Edge function error:', err);
    return new Response(
      JSON.stringify({
        aiPowered: false,
        message: 'An error occurred while processing the request. Using rule-based recommendations.',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
