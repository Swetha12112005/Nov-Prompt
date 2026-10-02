# NOVA CART — AI Business Rescue

**AI Business Rescue & Operations Intelligence Platform**

"Turn operational signals into actionable business decisions."

NOVA CART is a business intelligence application that investigates declining repeat purchases, rising cancellations, and increasing delivery times for a fictional quick-commerce platform. It uses data analysis, rule-based signal detection, and AI-assisted recommendations to identify high-impact operational signals and model the impact of improvements.

## Business Problem

NOVA CART is growing — orders and revenue are increasing. But repeat purchases are falling, cancellations are rising, and delivery times are getting worse. The application investigates: "What is the real problem?" using data, business reasoning, and AI-assisted analysis.

The application follows a clear analytical flow:

1. **Business Symptoms** — Growth in orders/revenue but declining repeat purchases, rising cancellations, increasing delivery times
2. **Data** — KPIs calculated from the dataset, trend charts, zone analysis
3. **Root-Cause Signals** — Rule-based detection of operational signals (hypotheses, not proven causation)
4. **Business Insights** — Structured recommendations with evidence and validation steps
5. **Recommendations** — AI-assisted advisor using Google Gemini (with rule-based fallback)
6. **Modeled Impact** — Interactive simulator for testing improvement scenarios

## Features

- **Login** — Supabase email/password authentication with route protection
- **Overview Dashboard** — 6 KPI cards with previous-period comparison, 6 trend charts, filters (zone, peak/non-peak, date range)
- **Root Cause Analysis** — Rule-based signal detection, causal chain hypothesis, cancellation analysis, peak vs non-peak analysis
- **Operations Monitor** — Zone performance table with 10 columns, rider capacity analysis, inventory analysis, 4 charts
- **AI Business Advisor** — Google Gemini-powered recommendations with rule-based fallback, loading/error states
- **Impact Simulator** — 3 sliders (rider 0-50%, inventory 0-30%, delivery 0-30%), 4 modeled metrics, model assumptions
- **Data Center** — CSV upload with full validation, data preview, sample download, schema reference
- **Methodology** — Documentation of dataset, KPIs, root-cause methodology, AI limitations, simulator assumptions

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Recharts
- Lucide React icons
- Supabase (auth + edge functions)
- Google Gemini AI (via edge function proxy)
- Vitest for testing

## Getting Started

```bash
npm install
npm run dev
```

## Authentication

The application uses Supabase email/password authentication. Email confirmation is disabled for the demo. Create an account on the login page, or sign in if you already have one.

The main application routes are protected — unauthenticated users see the login page. Sign out via the user menu in the top header.

## Environment Variables

All Supabase variables are pre-configured. For Google Gemini AI:

```
GEMINI_API_KEY=your_google_gemini_api_key
```

This is set as a Supabase Edge Function secret (not in client-side code). See "Google Service Configuration" below.

## Running Tests

```bash
npm test          # Run all tests once
npm run test:watch # Run in watch mode
```

Tests cover:
- Cancellation rate, repeat purchase rate, average delivery time, on-time delivery rate, revenue
- KPI comparison, zone metrics, peak metrics, rider analysis, inventory analysis
- Cancellation analysis, root-cause signal detection, recommendations
- Impact simulator (deterministic, edge cases, bounds)
- CSV validation (file type, MIME, size, columns, numerics, negatives, duplicates, dates, malformed input)

## Architecture

```
src/
  types/           — TypeScript interfaces
  data/            — Demo dataset and sample CSV generation
  logic/           — Business logic (calculations, analysis, simulator, CSV parser)
  lib/             — Services (Supabase client, auth context, AI advisor service)
  components/      — Shared UI components (sidebar, header, cards, badges, filters)
  pages/           — Page components for each navigation section
  tests/           — Vitest test suites
supabase/
  functions/       — Edge functions (AI advisor proxy)
  config.toml      — Supabase configuration
```

Business logic is fully separated from UI components. All calculations, analysis, and recommendations are reusable functions that operate on the `Order[]` data type.

## KPI Formulas

- **Cancellation Rate** = (cancelled orders / total orders) × 100
- **Repeat Purchase Rate** = (repeat purchases / delivered orders) × 100
- **Average Delivery Time** = mean(delivery_time) for non-cancelled orders
- **On-Time Delivery Rate** = (orders ≤ expected delivery time / delivered orders) × 100
- **Revenue** = sum(order_value) for non-cancelled orders

## Root-Cause Methodology

A transparent rule-based engine analyzes zones, peak vs non-peak periods, delivery time, cancellation reasons, rider availability, inventory availability, and repeat purchase patterns. Each detected signal includes: Observation, Evidence, Possible Contributing Factor, Confidence Level, and Recommended Investigation.

Signals are labeled as hypotheses — the application never presents correlation as proven causation.

## Google Service Configuration

The AI Business Advisor uses **Google Gemini AI** via a Supabase Edge Function proxy. The edge function (`supabase/functions/ai-advisor/index.ts`) sends structured KPIs and operational signals to the Gemini API and returns recommendations.

### Setup

1. Get a Google Gemini API key from [Google AI Studio](https://aistudio.google.com/)
2. Set it as a Supabase Edge Function secret named `GEMINI_API_KEY`
3. Deploy the edge function

The API key is never exposed in client-side code. All API calls go through the server-side edge function.

If the key is not configured or the request fails, the system falls back to deterministic rule-based recommendations and clearly labels this in the UI.

## Dataset Schema

| Column | Type | Description |
|--------|------|-------------|
| order_id | string | Unique order identifier |
| customer_id | string | Customer identifier |
| zone | string | Delivery zone |
| order_value | number | Order value (must be ≥ 0) |
| order_time | string | Order timestamp (ISO) |
| delivery_time | number | Actual delivery time in minutes |
| expected_delivery_time | number | Expected delivery time in minutes |
| cancelled | boolean | Whether order was cancelled |
| cancellation_reason | string | Reason for cancellation (optional) |
| rider_available | boolean | Whether a rider was available |
| inventory_available | boolean | Whether inventory was available |
| repeat_purchase | boolean | Whether customer returned |
| peak_hour | boolean | Whether order was during peak hours |
| timestamp | string | Order timestamp (ISO) |

## Security

- No hard-coded secrets or API keys in source code
- Google Gemini API key stored as server-side edge function secret only
- No `dangerouslySetInnerHTML` usage anywhere
- No `eval` or dynamic code execution
- CSV files validated for: extension, MIME type, file size, required columns, numeric fields, booleans, dates, negative values, duplicate IDs
- Uploaded content is parsed safely — never executed or injected into HTML
- All data processing happens client-side in the browser
- Supabase RLS enabled on all tables
- Authentication required for all application routes

## Accessibility

- Semantic HTML (header, nav, main, table with caption, th scope)
- ARIA labels on interactive elements (aria-label, aria-current, aria-expanded, aria-valuenow)
- Keyboard-accessible navigation and form controls
- Visible focus states on all interactive elements
- Chart text summaries for screen readers
- Status badges use text labels (not color-only communication)
- Form labels properly associated with inputs
- Sufficient text/background contrast

## Performance

- useMemo for expensive calculations (KPIs, trends, zone analysis)
- Filtered data memoized to avoid re-computation
- Efficient aggregation using Map-based grouping
- Production build with code splitting

## Limitations

- All data is synthetic. Recommendations are analytical hypotheses, not proven business strategies.
- The impact simulator uses simplified linear models.
- The AI advisor is limited by dataset quality and size.
- Correlation between delivery delays and repeat purchases does not prove causation.
- The demo dataset is small (360 orders). Production analysis requires larger samples.

## Demo Instructions

1. Create an account on the login page (any email/password with 6+ characters)
2. Navigate through the 7 pages using the sidebar
3. Use the filters on the Overview page to slice data by zone, period, and date range
4. Upload a CSV in the Data Center or download the sample CSV
5. Adjust the simulator sliders to see modeled impact
6. Check the Methodology page for detailed explanations
