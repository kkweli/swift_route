/**
 * LLM Insights Utilities (Frontend Only)
 * - Build a compact, privacy-safe prompt from the optimization response
 * - Fetch insights from Gemini with a strict timeout
 *
 * Requirements:
 * - Set VITE_GEMINI_API_KEY in your environment for browser usage
 *   (Vite exposes env vars prefixed with VITE_ to client)
 * - Restrict the key in Google Cloud to your domain and to Generative Language API only
 */

import type { RouteOptimizationResponse } from '@/lib/route-api';

export interface InsightsOptions {
  vehicleType?: string;
  optimizeFor?: 'distance' | 'time' | 'cost';
}

function round(n: number | undefined | null, digits = 2): number {
  if (typeof n !== 'number' || !isFinite(n)) return 0;
  const p = Math.pow(10, digits);
  return Math.round(n * p) / p;
}

/**
 * Build a concise prompt using only aggregate metrics (no coordinates/PII)
 */
export function buildInsightsPrompt(
  response: RouteOptimizationResponse,
  opts: InsightsOptions = {}
): string {
  const { data } = response;
  const baseline = data.baseline_route;
  const optimized = data.optimized_route;
  const alternatives = data.alternative_routes || [];
  const imp = data.improvements || {
    distance_saved: 0,
    time_saved: 0,
    cost_saved: 0,
    co2_saved: 0,
  };

  const header = `You are a logistics routing analyst. Provide concise, actionable insights in bullets (<= 700 chars). Focus on ${
    opts.optimizeFor || 'time'
  } for a ${opts.vehicleType || 'car'}.`;

  const baselineLine = `Baseline: ${round(baseline.distance, 2)} km, ${round(
    baseline.estimated_time,
    2
  )} min, ${round(baseline.cost, 2)} cost, ${round(
    baseline.co2_emissions,
    2
  )} kg CO2 (algo=${baseline.algorithm_used})`;

  const optimizedLine = `Optimized: ${round(optimized.distance, 2)} km, ${round(
    optimized.estimated_time,
    2
  )} min, ${round(optimized.cost, 2)} cost, ${round(
    optimized.co2_emissions,
    2
  )} kg CO2 (algo=${optimized.algorithm_used})`;

  const altLines = alternatives
    .slice(0, 3)
    .map(
      (r, i) =>
        `Alt${i + 1}: ${round(r.distance, 2)} km, ${round(r.estimated_time, 2)} min, ${round(
          r.cost,
          2
        )} cost, ${round(r.co2_emissions, 2)} kg CO2 (algo=${r.algorithm_used})`
    )
    .join('\n');

  const improvementsLine = `Improvements vs baseline: -${round(
    imp.distance_saved,
    2
  )} km, -${round(imp.time_saved, 2)} min, -${round(imp.cost_saved, 2)} cost, -${round(
    imp.co2_saved,
    2
  )} kg CO2.`;

  const instructions = `
Return a short bullet list:
- Best route and why, aligned to ${opts.optimizeFor || 'time'}
- Key trade-offs (time vs cost vs emissions)
- Any caution or heuristics (e.g., traffic, vehicle constraints)
Avoid repeating numbers excessively. Keep it succinct and practical.`;

  const prompt = [
    header,
    '',
    baselineLine,
    optimizedLine,
    altLines ? altLines : undefined,
    improvementsLine,
    '',
    instructions,
  ]
    .filter(Boolean)
    .join('\n');

  // Enforce a hard cap to reduce latency and costs
  return prompt.length > 1200 ? prompt.slice(0, 1200) : prompt;
}

export interface FetchLLMOptions {
  timeoutMs?: number; // default 4000ms
  model?: string; // default gemini-1.5-flash
  temperature?: number; // default 0.4
  maxOutputTokens?: number; // default 180
}

/**
 * Fetch insights from Gemini with strict timeout and a single fast fallback.
 * Returns string on success, or null on failure/timeout/misconfig.
 */
export async function fetchLLMInsights(
  prompt: string,
  options: FetchLLMOptions = {}
): Promise<string | null> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (!apiKey) {
    console.warn('VITE_GEMINI_API_KEY is not set; skipping LLM insights.');
    return null;
  }

  const primaryModel = options.model || (import.meta.env.VITE_GEMINI_MODEL as string) || 'gemini-1.5-flash';
  const temperature = options.temperature ?? 0.4;
  const maxOutputTokens = options.maxOutputTokens ?? 180;
  const primaryTimeoutMs = Math.max(800, options.timeoutMs ?? 4000);

  async function requestOnce(model: string, timeoutMs: number, tokens: number) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      const resp = await fetch(url, {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature, maxOutputTokens: tokens },
        }),
      });
      clearTimeout(id);
      if (!resp.ok) {
        console.warn('LLM request failed:', resp.status, resp.statusText, 'model:', model);
        return null;
      }
      const data = (await resp.json()) as GeminiResponse;
      const text = data?.candidates?.[0]?.content?.parts
        ?.map((p: GeminiContentPart) => p?.text)
        .filter(Boolean)
        .join('') || null;
      return (typeof text === 'string' && text.trim().length > 0) ? text.trim() : null;
    } catch (err) {
      clearTimeout(id);
      console.warn('LLM request error:', err, 'model:', model);
      // Re-throw AbortError so caller can decide whether to skip fallback
      if (err && (err as { name?: string }).name === 'AbortError') {
        throw err;
      }
      return null;
    }
  }

  // Attempt primary model
  try {
    const primary = await requestOnce(primaryModel, primaryTimeoutMs, maxOutputTokens);
    if (primary) return primary;
  } catch (e) {
    // Primary attempt timed out; skip fallback to avoid repeated timeouts
    return null;
  }

  // Fallback: smaller, faster model with shorter timeout and fewer tokens
  const fallbackModel = 'gemini-1.5-flash-8b';
  const fallback = await requestOnce(
    fallbackModel,
    Math.max(600, Math.floor(primaryTimeoutMs * 0.6)),
    Math.min(160, maxOutputTokens)
  );
  return fallback;
}
