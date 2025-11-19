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

function formatLocalTime(): string {
  const d = new Date();
  let hours = d.getHours();
  const minutes = d.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // the hour '0' should be '12'
  const mm = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const hh = hours < 10 ? `0${hours}` : `${hours}`;
  return `${hh}:${mm} ${ampm}`;
}

export interface ContextOptions extends InsightsOptions {
  coordinates?: {
    origin: { lat: number; lng: number } | null;
    destination: { lat: number; lng: number } | null;
    waypoints: { lat: number; lng: number }[];
  };
}

export function buildContextPrompt(
  response: RouteOptimizationResponse,
  opts: ContextOptions = {}
): string {
  const t = response?.data?.traffic_info as any;
  const amenities = (response?.data?.amenities || []).slice(0, 8) as any[];
  const coords = opts.coordinates;
  
  const area = (t?.area_type || 'unknown').toString();
  const trafficLevel = Number(t?.traffic_level ?? 1).toFixed(1);
  const now = formatLocalTime();
  const currentHour = new Date().getHours();
  
  // Determine region context from coordinates
  let regionContext = 'East Africa';
  let weatherContext = 'tropical climate';
  let accessibilityNotes = 'Standard road access';
  
  if (coords?.origin) {
    const lat = coords.origin.lat;
    const lng = coords.origin.lng;
    
    // Kenya/Nairobi region detection
    if (lat >= -4.5 && lat <= 1.5 && lng >= 33.5 && lng <= 42) {
      regionContext = 'Kenya - Nairobi Metropolitan';
      weatherContext = currentHour >= 6 && currentHour <= 18 ? 'Dry season, good visibility' : 'Night conditions, reduced visibility';
      
      if (currentHour >= 7 && currentHour <= 9) {
        accessibilityNotes = 'Morning rush hour - expect heavy traffic on major roads';
      } else if (currentHour >= 17 && currentHour <= 19) {
        accessibilityNotes = 'Evening rush hour - significant congestion expected';
      } else if (currentHour >= 22 || currentHour <= 5) {
        accessibilityNotes = 'Night travel - reduced public transport, security considerations';
      } else {
        accessibilityNotes = 'Off-peak hours - optimal road conditions';
      }
    }
  }

  // Build enhanced context prompt
  const lines: string[] = [];
  lines.push('You are a local logistics expert. Provide detailed route context in GitHub Markdown format.');
  lines.push('Include specific amenity names, weather conditions, and accessibility factors.');
  lines.push('');
  lines.push('## Route Environment Analysis');
  lines.push('');
  lines.push('### Current Conditions');
  lines.push(`**Location**: ${regionContext}`);
  lines.push(`**Time**: ${now} (${currentHour}:00 hour)`);
  lines.push(`**Weather**: ${weatherContext}`);
  lines.push(`**Traffic Level**: ${trafficLevel}x normal (${area} area)`);
  lines.push(`**Accessibility**: ${accessibilityNotes}`);
  lines.push('');
  lines.push('### Amenities & Infrastructure');
  
  // Enhanced amenity analysis with specific names
  const amenityDetails = generateAmenityDetails(amenities, regionContext, currentHour);
  for (const detail of amenityDetails) {
    lines.push(`**${detail.category}**: ${detail.description}`);
  }
  
  lines.push('');
  lines.push('### Vehicle-Specific Considerations');
  const vehicleType = opts.vehicleType || 'car';
  lines.push(getVehicleSpecificAdvice(vehicleType, area, currentHour));
  
  lines.push('');
  lines.push('**Instructions**: Provide practical, location-specific advice. Include real amenity names where possible. Focus on current time/weather impacts.');

  return lines.join('\n');
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateAmenityDetails(amenities: any[], region: string, hour: number): Array<{category: string, description: string}> {
  const details: Array<{category: string, description: string}> = [];
  
  // Group amenities by type
  const byType: Record<string, number> = {};
  for (const a of amenities) {
    const type = (a?.type || 'general').toString();
    byType[type] = (byType[type] || 0) + 1;
  }
  
  // Generate specific amenity descriptions based on region and time
  const isKenyaRegion = region.includes('Kenya');
  const isBusinessHours = hour >= 8 && hour <= 18;
  
  if (byType['fuel_station'] || byType['gas_station']) {
    const stations = isKenyaRegion ? 'Shell, Total, Kenol stations' : 'Major fuel stations';
    const availability = isBusinessHours ? 'Full service available' : 'Limited night service';
    details.push({
      category: 'Fuel Stations',
      description: `${stations} along route. ${availability}. ${byType['fuel_station'] || byType['gas_station'] || 1} locations identified.`
    });
  }
  
  if (byType['restaurant'] || byType['food']) {
    const options = isKenyaRegion ? 'Local eateries, Java House, KFC outlets' : 'Dining options';
    const timing = isBusinessHours ? 'Full menu available' : 'Limited late-night options';
    details.push({
      category: 'Dining',
      description: `${options} nearby. ${timing}. ${byType['restaurant'] || byType['food'] || 1} establishments found.`
    });
  }
  
  if (byType['parking'] || byType['parking_lot']) {
    const security = isKenyaRegion ? 'Secure parking with attendants' : 'Parking facilities';
    const cost = isBusinessHours ? 'Standard rates apply' : 'Reduced overnight rates';
    details.push({
      category: 'Parking',
      description: `${security} available. ${cost}. ${byType['parking'] || byType['parking_lot'] || 1} facilities located.`
    });
  }
  
  if (byType['hospital'] || byType['medical']) {
    const facilities = isKenyaRegion ? 'Nairobi Hospital, Aga Khan facilities' : 'Medical facilities';
    details.push({
      category: 'Medical Services',
      description: `${facilities} accessible. Emergency services available 24/7. ${byType['hospital'] || byType['medical'] || 1} facilities nearby.`
    });
  }
  
  if (byType['bank'] || byType['atm']) {
    const services = isKenyaRegion ? 'KCB, Equity Bank ATMs, M-Pesa agents' : 'Banking services';
    const hours = isBusinessHours ? 'Full banking services' : 'ATM services only';
    details.push({
      category: 'Financial Services',
      description: `${services} available. ${hours}. ${byType['bank'] || byType['atm'] || 1} locations found.`
    });
  }
  
  // Add weather-specific advice
  if (hour >= 6 && hour <= 18) {
    details.push({
      category: 'Weather Conditions',
      description: 'Daylight hours with good visibility. Dry conditions expected. UV protection recommended for outdoor activities.'
    });
  } else {
    details.push({
      category: 'Weather Conditions', 
      description: 'Night conditions with reduced visibility. Cool temperatures. Ensure vehicle lights are functional.'
    });
  }
  
  return details.slice(0, 6); // Limit to 6 categories
}

function getVehicleSpecificAdvice(vehicleType: string, area: string, hour: number): string {
  const isUrban = area.includes('commercial') || area.includes('residential');
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  
  switch (vehicleType.toLowerCase()) {
    case 'motorcycle':
      return isUrban && isRushHour 
        ? '**Motorcycle**: Lane filtering possible but exercise caution. Watch for pedestrians and matatus. Helmet required.'
        : '**Motorcycle**: Good mobility advantage. Fuel efficient. Secure parking recommended.';
    
    case 'truck':
      return isUrban 
        ? '**Truck**: Avoid CBD restrictions (6AM-10AM, 4PM-8PM). Use designated truck routes. Loading zones available.'
        : '**Truck**: Highway routing preferred. Check bridge weight limits. Rest areas every 100km.';
    
    case 'van':
      return isRushHour 
        ? '**Van**: Moderate size advantage over trucks. Can access most urban areas. Consider delivery time windows.'
        : '**Van**: Flexible routing options. Good for mixed urban/highway travel. Parking generally available.';
    
    default: // car, electric_car
      return vehicleType === 'electric_car'
        ? '**Electric Vehicle**: Charging stations at malls and hotels. Range planning essential. Regenerative braking in traffic.'
        : '**Car**: Standard road access. All parking options available. Consider carpooling during peak hours.';
  }
}

function hintForAmenity(type: string): string {
  const t = type.toLowerCase();
  if (t.includes('gas') || t.includes('fuel')) return 'Fuel stops available along route';
  if (t.includes('restaurant') || t.includes('food')) return 'Meal options available';
  if (t.includes('parking')) return 'Parking available along route';
  if (t.includes('rest') || t.includes('break')) return 'Rest areas available';
  return 'Amenity available along route';
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
Format strictly as GitHub-flavored Markdown:
**AI Route Analysis**\n\n- Summary (best route for ${opts.optimizeFor || 'time'} and why)
- Trade-offs (time vs cost vs emissions)
- Recommendation (what to pick and when)
- Heuristic (1 actionable tip for ${opts.vehicleType || 'vehicle'})\n\nRules: No code fences. Keep <= 700 chars. Avoid repeating raw numbers excessively.`;

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
function normalizeMarkdown(text: string): string {
  if (!text) return text;
  let t = text.replace(/\\n/g, '\n'); // unescape newlines
  if (!/^\s*\*\*AI Route Analysis\*\*/.test(t) && !/^\s*#/.test(t)) {
    t = `**AI Route Analysis**\n\n${t}`;
  }
  t = t
    .split('\n')
    .map((line) => line.replace(/^\s*\*\s+/, '- ').replace(/^\s*•\s+/, '- '))
    .join('\n');
  t = t.replace(/\n{3,}/g, '\n\n');
  return t.trim();
}

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
      if (typeof text === 'string' && text.trim().length > 0) {
        return normalizeMarkdown(text.trim());
      }
      return null;
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
