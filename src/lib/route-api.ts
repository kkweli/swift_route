/**
 * Route Optimization API Client
 * Client-side utilities for route optimization endpoints
 */

import { LatLng } from '@/components/InteractiveMap';

export interface RouteOptimizationRequest {
  origin: [number, number]; // [lat, lng]
  destination: [number, number];
  waypoints?: [number, number][];
  vehicle_type?: 'car' | 'truck' | 'van' | 'motorcycle';
  optimize_for?: 'distance' | 'time' | 'cost';
  alternatives?: number;
  factor?: number;
  avoid_tolls?: boolean;
  avoid_traffic?: boolean;
}

export interface RouteResult {
  route_id: string;
  coordinates: LatLng[];
  distance: number; // km
  estimated_time: number; // minutes
  cost: number; // currency units
  co2_emissions: number; // kg
  algorithm_used: string;
  processing_time: number; // ms
  confidence_score?: number;
}

export interface TrafficInfo {
  current_hour_utc: number;
  area_type: string;
  traffic_level: number;
  traffic_description: string;
  avoid_route: boolean;
}

export interface Amenity {
  type: string;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface RouteOptimizationResponse {
  data: {
    baseline_route: RouteResult;
    optimized_route: RouteResult;
    alternative_routes?: RouteResult[];
    improvements: {
      distance_saved: number;
      time_saved: number;
      cost_saved: number;
      co2_saved: number;
    };
    traffic_info?: TrafficInfo;
    amenities?: Amenity[];
  };
  metadata: {
    algorithm_used: string;
    processing_time: number;
    request_id: string;
    trial_mode?: boolean;
    upgrade_message?: string;
  };
  usage: {
    requests_remaining: number;
    requests_limit: number;
    billing_tier: string;
    trial_expires?: string;
  };
  request_id: string;
  timestamp: string;
}

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  request_id: string;
  timestamp: string;
}

export class RouteAPIClient {
  private baseURL: string;
  private apiKey: string;

  constructor(apiKey: string, baseURL: string = '/api/v1/optimize-route') {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  /**
   * Optimize a route
   */
  async optimizeRoute(
    request: RouteOptimizationRequest
  ): Promise<RouteOptimizationResponse> {
    const url = `${this.baseURL}/optimize`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Send both Authorization and X-API-Key to support both bearer tokens
          // and legacy API-key clients. The gateway will prefer Bearer as a
          // dashboard session token, and `X-API-Key` will be used for B2B keys.
          'Authorization': `Bearer ${this.apiKey}`,
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify(request),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new RouteAPIError(data as APIError, response.status);
      }

      return data as RouteOptimizationResponse;
    } catch (error) {
      if (error instanceof RouteAPIError) {
        throw error;
      }

      throw new RouteAPIError(
        {
          error: {
            code: 'NETWORK_ERROR',
            message: 'Failed to connect to route optimization API',
            details: error instanceof Error ? error.message : 'Unknown error',
          },
          request_id: `client_${Date.now()}`,
          timestamp: new Date().toISOString(),
        },
        0
      );
    }
  }

  /**
   * Convert LatLng to coordinate tuple
   */
  static toCoordinateTuple(latlng: LatLng): [number, number] {
    return [latlng.lat, latlng.lng];
  }

  /**
   * Convert coordinate tuple to LatLng
   */
  static fromCoordinateTuple(coord: [number, number]): LatLng {
    return { lat: coord[0], lng: coord[1] };
  }
}

export class RouteAPIError extends Error {
  public readonly apiError: APIError;
  public readonly status: number;

  constructor(apiError: APIError, status: number) {
    super(apiError.error.message);
    this.apiError = apiError;
    this.status = status;
    this.name = 'RouteAPIError';
  }

  get code(): string {
    return this.apiError.error.code;
  }

  get isRateLimitError(): boolean {
    return this.status === 429 || this.code === 'RATE_LIMIT_EXCEEDED';
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.code === 'INVALID_API_KEY' || this.code === 'MISSING_API_KEY';
  }

  get isTrialExpired(): boolean {
    return this.code === 'TRIAL_EXPIRED' || this.code === 'INSUFFICIENT_CREDITS';
  }
}

/**
 * Helper function to format API errors for display
 */
export function formatRouteAPIError(error: RouteAPIError): string {
  if (error.isRateLimitError) {
    return 'Rate limit exceeded. Please wait a moment and try again.';
  }
  if (error.isAuthError) {
    return 'Authentication failed. Please check your API key.';
  }
  if (error.isTrialExpired) {
    return 'Trial expired or insufficient credits. Please upgrade your plan.';
  }
  return error.message || 'An error occurred while optimizing the route.';
}
