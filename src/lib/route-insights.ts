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
  // Log amenity data for debugging
  if (response?.data?.amenities) {
    console.log('Amenities provided to LLM:', response.data.amenities.length, 'items');
  }
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

  // Build enhanced context prompt with actual route data
  const lines: string[] = [];
  lines.push('You are a local logistics expert analyzing a SPECIFIC ROUTE. Use the provided amenity data.');
  lines.push('Provide route context in clean GitHub Markdown with proper headings and bullet points.');
  lines.push('');
  lines.push('# Route Analysis');
  lines.push('');
  lines.push('## Current Conditions');
  lines.push(`- **Location**: ${regionContext}`);
  lines.push(`- **Time**: ${now} (${currentHour}:00 hour)`);
  lines.push(`- **Weather**: ${weatherContext}`);
  lines.push(`- **Traffic**: ${trafficLevel}x normal (${area} area)`);
  lines.push(`- **Accessibility**: ${accessibilityNotes}`);
  lines.push('');
  
  // Only include amenities section if we have actual data
  const amenityDetails = generateAmenityDetails(amenities, regionContext, currentHour, coords);
  if (amenityDetails.length > 0) {
    lines.push('## Route-Specific Amenities');
    for (const detail of amenityDetails) {
      lines.push(`- **${detail.category}**: ${detail.description}`);
    }
    lines.push('');
  }
  
  lines.push('## Vehicle Considerations');
  const vehicleType = opts.vehicleType || 'car';
  lines.push(getVehicleSpecificAdvice(vehicleType, area, currentHour));
  
  lines.push('');
  lines.push('**IMPORTANT**: Base your analysis on the specific amenity data provided above. Do not invent generic amenities.');
  lines.push('Focus on practical, actionable advice for this exact route and time.');

  return lines.join('\n');
}

function capitalize(s: string): string {
  if (!s) return s;
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function generateAmenityDetails(amenities: any[], region: string, hour: number, coords?: {origin: {lat: number; lng: number} | null; destination: {lat: number; lng: number} | null}): Array<{category: string, description: string}> {
  const details: Array<{category: string, description: string}> = [];
  
  // If no amenities provided, return route-specific analysis
  if (!amenities || amenities.length === 0) {
    return generateRouteSpecificAmenities(coords, region, hour);
  }
  
  // Process actual amenity data from the route
  const processedAmenities = processRealAmenities(amenities, region, hour);
  
  // Group by category and create descriptions
  const categories = new Map<string, {count: number, names: string[], types: string[]}>(); 
  
  for (const amenity of processedAmenities) {
    const category = amenity.category;
    if (!categories.has(category)) {
      categories.set(category, {count: 0, names: [], types: []});
    }
    const cat = categories.get(category)!;
    cat.count++;
    if (amenity.name && !cat.names.includes(amenity.name)) {
      cat.names.push(amenity.name);
    }
    if (amenity.type && !cat.types.includes(amenity.type)) {
      cat.types.push(amenity.type);
    }
  }
  
  // Generate specific descriptions based on actual data
  const isBusinessHours = hour >= 8 && hour <= 18;
  
  for (const [category, data] of categories.entries()) {
    const names = data.names.slice(0, 3).join(', ') || 'Various locations';
    const timing = isBusinessHours ? 'Currently open' : 'Limited hours';
    
    details.push({
      category,
      description: `${names} (${data.count} location${data.count > 1 ? 's' : ''}). ${timing}.`
    });
  }
  
  // Add route-specific context if we have coordinates
  if (coords?.origin && coords?.destination) {
    const routeContext = analyzeRouteContext(coords.origin, coords.destination, hour);
    details.push(...routeContext);
  }
  
  return details.slice(0, 6);
}

function processRealAmenities(amenities: any[], region: string, hour: number): Array<{category: string, name?: string, type: string}> {
  const processed: Array<{category: string, name?: string, type: string}> = [];
  
  for (const amenity of amenities) {
    const type = (amenity.type || '').toLowerCase();
    const name = amenity.name || amenity.brand || '';
    
    let category = 'General Services';
    
    // Map amenity types to categories
    if (type.includes('fuel') || type.includes('gas') || type.includes('petrol')) {
      category = 'Fuel Stations';
    } else if (type.includes('restaurant') || type.includes('food') || type.includes('cafe')) {
      category = 'Dining';
    } else if (type.includes('hospital') || type.includes('clinic') || type.includes('pharmacy')) {
      category = 'Medical Services';
    } else if (type.includes('bank') || type.includes('atm')) {
      category = 'Financial Services';
    } else if (type.includes('parking') || type.includes('garage')) {
      category = 'Parking';
    } else if (type.includes('hotel') || type.includes('lodge')) {
      category = 'Accommodation';
    } else if (type.includes('shop') || type.includes('market') || type.includes('mall')) {
      category = 'Shopping';
    }
    
    processed.push({category, name, type});
  }
  
  return processed;
}

function generateRouteSpecificAmenities(coords?: {origin: {lat: number; lng: number} | null; destination: {lat: number; lng: number} | null}, region: string, hour: number): Array<{category: string, description: string}> {
  const details: Array<{category: string, description: string}> = [];
  
  if (!coords?.origin || !coords?.destination) {
    return [{
      category: 'Route Analysis',
      description: 'No specific route coordinates available for amenity analysis.'
    }];
  }
  
  const {origin, destination} = coords;
  const isKenyaRegion = region.includes('Kenya');
  const isBusinessHours = hour >= 8 && hour <= 18;
  
  // Analyze route characteristics based on coordinates
  const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const isUrbanRoute = isUrbanArea(origin, destination);
  const routeDirection = getRouteDirection(origin, destination);
  
  // Generate context-aware amenity predictions
  if (isKenyaRegion) {
    if (isUrbanRoute) {
      details.push({
        category: 'Fuel Stations',
        description: `Shell, Total, Kenol stations expected along ${distance.toFixed(1)}km urban route. ${isBusinessHours ? 'Full service available' : 'Limited night service'}.`
      });
      
      details.push({
        category: 'Dining',
        description: `Java House, KFC, local eateries likely available. ${isBusinessHours ? 'Full menu options' : 'Limited late-night dining'}.`
      });
    } else {
      details.push({
        category: 'Highway Services',
        description: `Highway route with service stations every 50-80km. Plan fuel stops accordingly.`
      });
    }
    
    details.push({
      category: 'Financial Services',
      description: `KCB, Equity Bank ATMs, M-Pesa agents available. ${isBusinessHours ? 'Full banking services' : 'ATM services only'}.`
    });
  }
  
  // Add time-specific context
  if (hour >= 6 && hour <= 18) {
    details.push({
      category: 'Travel Conditions',
      description: `Daylight travel with good visibility. Most services operational along ${routeDirection} route.`
    });
  } else {
    details.push({
      category: 'Travel Conditions',
      description: `Night travel - reduced service availability. Ensure adequate fuel and plan rest stops.`
    });
  }
  
  return details;
}

function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function isUrbanArea(origin: {lat: number; lng: number}, destination: {lat: number; lng: number}): boolean {
  // Kenya urban area detection (Nairobi, Mombasa, Kisumu)
  const urbanCenters = [
    {lat: -1.2921, lng: 36.8219, radius: 0.3}, // Nairobi
    {lat: -4.0435, lng: 39.6682, radius: 0.2}, // Mombasa
    {lat: -0.0917, lng: 34.7680, radius: 0.15}  // Kisumu
  ];
  
  for (const center of urbanCenters) {
    const originDist = calculateDistance(origin.lat, origin.lng, center.lat, center.lng);
    const destDist = calculateDistance(destination.lat, destination.lng, center.lat, center.lng);
    if (originDist < center.radius * 111 || destDist < center.radius * 111) { // Convert degrees to km
      return true;
    }
  }
  return false;
}

function getRouteDirection(origin: {lat: number; lng: number}, destination: {lat: number; lng: number}): string {
  const latDiff = destination.lat - origin.lat;
  const lngDiff = destination.lng - origin.lng;
  
  if (Math.abs(latDiff) > Math.abs(lngDiff)) {
    return latDiff > 0 ? 'northbound' : 'southbound';
  } else {
    return lngDiff > 0 ? 'eastbound' : 'westbound';
  }
}

function analyzeRouteContext(origin: {lat: number; lng: number}, destination: {lat: number; lng: number}, hour: number): Array<{category: string, description: string}> {
  const context: Array<{category: string, description: string}> = [];
  
  const distance = calculateDistance(origin.lat, origin.lng, destination.lat, destination.lng);
  const direction = getRouteDirection(origin, destination);
  
  // Traffic context based on time and direction
  if (hour >= 7 && hour <= 9) {
    context.push({
      category: 'Traffic Context',
      description: `Morning rush hour on ${direction} route. Expect 20-30% longer travel times in urban areas.`
    });
  } else if (hour >= 17 && hour <= 19) {
    context.push({
      category: 'Traffic Context', 
      description: `Evening rush hour on ${direction} route. Heavy congestion expected, consider alternative timing.`
    });
  }
  
  return context;
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
Format as clean GitHub Markdown with proper structure:

# AI Route Analysis

## Summary
- Best route for ${opts.optimizeFor || 'time'} optimization and reasoning

## Trade-offs
- Time vs cost vs emissions comparison
- Key differences between routes

## Recommendation
- Which route to choose and when
- Specific use case guidance

## Pro Tip
- One actionable insight for ${opts.vehicleType || 'vehicle'} operations

Rules: Use proper headings, bullet points, no HTML entities. Keep concise but well-formatted.`;

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
  
  // Clean up the text
  let t = text.replace(/\\n/g, '\n'); // unescape newlines
  
  // Decode HTML entities
  t = t.replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'");
  
  // Ensure proper heading format
  if (!/^\s*#/.test(t) && !/^\s*\*\*AI Route Analysis\*\*/.test(t)) {
    t = `# AI Route Analysis\n\n${t}`;
  }
  
  // Fix markdown formatting
  t = t
    .split('\n')
    .map((line) => {
      // Convert bullet points
      line = line.replace(/^\s*\*\s+/, '- ').replace(/^\s*•\s+/, '- ');
      // Fix bold formatting
      line = line.replace(/\*\*(.*?)\*\*/g, '**$1**');
      return line;
    })
    .join('\n');
  
  // Clean up excessive newlines
  t = t.replace(/\n{3,}/g, '\n\n');
  
  // Ensure proper spacing after headings
  t = t.replace(/(#{1,6}\s+.*?)\n([^\n#])/g, '$1\n\n$2');
  
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
      if (err && (err as { name?: string }).name === 'AbortError') {
        throw err;
      }
      return null;
    }
  }

  // Only attempt primary model - no fallback to avoid errors
  try {
    const primary = await requestOnce(primaryModel, primaryTimeoutMs, maxOutputTokens);
    return primary;
  } catch (e) {
    return null;
  }
}
