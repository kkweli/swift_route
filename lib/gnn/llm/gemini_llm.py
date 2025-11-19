"""Gemini LLM summarizer for route candidates with fallback.

This module provides a summarizer interface that uses the Google Gemini API
if `GEMINI_API_KEY` is configured. If the API key is missing, or the API call fails,
it falls back to a deterministic, template-based summarizer to avoid sending
coordinates or PII to external services.
"""
import os
import json
import logging
from typing import List, Dict, Any, Optional

# Conditional import for google.generativeai
try:
    import google.generativeai as genai
    _gemini_available = True
except ImportError:
    _gemini_available = False
    logging.warning("Google Generative AI library not found. Gemini LLM will be unavailable.")

def _call_gemini_api(prompt: str) -> Optional[str]:
    """Calls the Gemini API with the given prompt."""
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        logging.warning("GEMINI_API_KEY not set. Cannot call Gemini API.")
        return None

    if not _gemini_available:
        logging.warning("Google Generative AI library not loaded. Cannot call Gemini API.")
        return None

    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel('gemini-2.5-flash-lite')
        response = model.generate_content(prompt)
        # Assuming the response format is text, or can be converted to string
        return response.text
    except Exception as e:
        logging.error(f"Error calling Gemini API: {e}")
        return None

def _generate_fallback_summary(candidates: List[Dict]) -> Dict:
    """Creates a short, deterministic summary for a list of route candidate dicts."""
    summaries = []
    for i, c in enumerate(candidates):
        distance = c.get('distance') or c.get('distance_km') or 0
        time_min = c.get('estimated_time') or c.get('time_minutes') or 0
        cost = c.get('cost') or c.get('cost_usd') or 0
        co2 = c.get('co2_emissions') or c.get('emissions_kg') or 0

        label = f"Option {i+1}: {int(time_min)} min / {distance} km"
        trade = f"Estimated time {int(time_min)} min, cost ${round(cost,2)}, CO2 {round(co2,2)} kg."
        suggestions = "".join([
            "Avoid tolls to reduce cost." if cost and cost > 5 else "",
            "Consider earlier departure to avoid peak traffic." if time_min and time_min > 45 else ""
        ])

        summaries.append({
            'label': label,
            'summary': trade,
            'suggestion': suggestions.strip(),
            'confidence_score': 0.75
        })

    overall = {
        'routes': summaries,
        'note': 'This summary is generated locally. Enable GEMINI_API_KEY for richer explanations.',
        'used_llm': False
    }
    return overall

def summarize_candidates(candidates: List[Dict]) -> Dict:
    """Summarize route candidates using Gemini LLM if available, otherwise use fallback.

    Each candidate is expected to have: distance, estimated_time, cost, co2_emissions, algorithm_used
    Returns a dict with per-candidate labels, summary, suggestions, and LLM usage info.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if api_key and _gemini_available:
        try:
            prompt_data = json.dumps(candidates, indent=2)
            prompt = f"""
            You are a Logistics Geography & Environmental Intelligence AI specializing in route analysis for transportation and logistics operations.

            Analyze these routes for a commercial vehicle (likely truck or van) in a logistics operational context. Provide detailed, actionable insights focused on the physical environment, infrastructure, and operational implications.

            For EACH ROUTE analyze these key logistics dimensions:

            **WEATHER & ENVIRONMENTAL CONDITIONS:**
            - Current weather patterns and seasonal impacts
            - Road condition risks (puddles, flooding, black ice)
            - Visibility concerns and driver safety
            - Temperature effects on cargo and vehicle performance

            **ROAD INFRASTRUCTURE & TERRAIN ANALYSIS:**
            - Road quality and maintenance levels (potholes, cracks, wear)
            - Terrain challenges (hills, curves, gradients, limited visibility)
            - Bridge and tunnel characteristics
            - Parking and maneuverability issues
            - Weight restrictions and axle limitations
            - Emergency lane accessibility

            **AMENITIES & SUPPORT INFRASTRUCTURE:**
            - Fuel stations, rest areas, and break facilities
            - Loading docks and warehousing availability
            - Emergency services proximity
            - Maintenance facilities and repair options
            - Restroom and driver comfort facilities
            - Communication coverage and dead zones

            **GEOGRAPHICAL & LOGISTICS CONTEXT:**
            - Urban vs rural operational considerations
            - Time zone changes and shift considerations
            - Border crossing implications (if relevant)
            - Regional traffic pattern knowledge
            - Local regulation variations
            - Economic zone considerations

            **LOGISTICS-SPECIFIC INSIGHTS:**
            - Just-in-Time delivery feasibility
            - Load securing and safety concerns
            - Driver fatigue risk assessment
            - Emergency contingency planning
            - Alternative routing potential

            For each route provide:
            - Route summary with key logistics implications
            - Top 3 operational advantages and challenges
            - Weather-dependent recommendations
            - Infrastructure reliability assessment
            - Cost implications in logistics context

            Overall provide:
            - Weather readiness assessment ('Poor'/'Good'/'Excellent')
            - Infrastructure quality rating ('Poor'/'Good'/'Excellent')
            - Driver comfort and safety index (0-100)
            - Emergency preparedness score (0-100)
            - Overall logistics suitability rating ('Poor'/'Good'/'Excellent')

            Output as structured JSON with comprehensive logistics intelligence.

            Route Candidates:
            {prompt_data}
            """
            gemini_response_text = _call_gemini_api(prompt)
            if gemini_response_text:
                try:
                    gemini_json = json.loads(gemini_response_text)
                    gemini_json['used_llm'] = True
                    gemini_json['note'] = 'Summary generated by Gemini LLM.'
                    return gemini_json
                except json.JSONDecodeError:
                    logging.error("Gemini API returned non-JSON response.")
            logging.warning("Gemini API call failed or returned empty. Falling back to local summary.")
        except Exception as e:
            logging.error(f"Error preparing or calling Gemini API: {e}. Falling back to local summary.")

    return _generate_fallback_summary(candidates)
