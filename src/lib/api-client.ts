/**
 * SwiftRoute API Client
 * Client-side utilities for interacting with the SwiftRoute API
 */

export interface APIResponse<T = any> {
  data: T;
  metadata?: {
    processing_time?: number;
    algorithm_used?: string;
    request_id?: string;
  };
  usage?: {
    requests_remaining?: number;
    billing_tier?: string;
  };
  request_id: string;
  timestamp: string;
}

export interface APIError {
  error: {
    code: string;
    message: string;
    details?: any;
  };
  request_id: string;
  timestamp: string;
}

export interface HealthCheckResponse {
  status: string;
  timestamp: string;
  version: string;
  services: {
    database: string;
    authentication: string;
    api: string;
  };
}

export interface UsageStatsResponse {
  client_info: {
    client_id: string;
    email: string;
    billing_tier: string;
    status: string;
  };
  usage_summary: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    success_rate: number;
    avg_response_time_ms: number;
    period_days: number;
  };
  rate_limiting: {
    current_tier: string;
    requests_per_minute: number;
    current_usage: number;
    remaining_requests: number;
    reset_time: string;
  };
  daily_usage: Array<{
    date: string;
    requests: number;
    success_rate: number;
  }>;
  endpoints_used: Array<{
    endpoint: string;
    requests: number;
    success_rate: number;
  }>;
}

export class SwiftRouteAPIClient {
  private baseURL: string;
  private apiKey?: string;

  constructor(baseURL: string = 'http://localhost:3001', apiKey?: string) {
    this.baseURL = baseURL;
    this.apiKey = apiKey;
  }

  setAPIKey(apiKey: string) {
    this.apiKey = apiKey;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<APIResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.apiKey) {
      headers['X-API-Key'] = this.apiKey;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new APIClientError(data as APIError, response.status);
      }

      return data as APIResponse<T>;
    } catch (error) {
      if (error instanceof APIClientError) {
        throw error;
      }
      
      throw new APIClientError({
        error: {
          code: 'NETWORK_ERROR',
          message: 'Failed to connect to API',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        request_id: `client_${Date.now()}`,
        timestamp: new Date().toISOString()
      }, 0);
    }
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<APIResponse<HealthCheckResponse>> {
    return this.makeRequest<HealthCheckResponse>('/api/v1/health');
  }

  /**
   * Get usage statistics
   */
  async getUsageStats(): Promise<APIResponse<UsageStatsResponse>> {
    if (!this.apiKey) {
      throw new Error('API key required for usage statistics');
    }
    return this.makeRequest<UsageStatsResponse>('/api/v1/usage');
  }

  /**
   * Get API documentation
   */
  async getAPIDocs(): Promise<any> {
    return this.makeRequest('/api/v1/docs');
  }

  /**
   * Test API key validity
   */
  async testAPIKey(apiKey?: string): Promise<{
    valid: boolean;
    error?: string;
    clientInfo?: any;
  }> {
    const testKey = apiKey || this.apiKey;
    if (!testKey) {
      return { valid: false, error: 'No API key provided' };
    }

    try {
      const originalKey = this.apiKey;
      this.setAPIKey(testKey);
      
      const response = await this.healthCheck();
      
      // Restore original key
      if (originalKey) {
        this.setAPIKey(originalKey);
      }

      return {
        valid: true,
        clientInfo: response.usage
      };
    } catch (error) {
      return {
        valid: false,
        error: error instanceof APIClientError ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Simulate rate limiting test
   */
  async testRateLimit(requests: number = 15): Promise<{
    results: Array<{
      request: number;
      success: boolean;
      status: number;
      responseTime: number;
      error?: string;
    }>;
    rateLimitHit: boolean;
    rateLimitAt?: number;
  }> {
    const results = [];
    let rateLimitHit = false;
    let rateLimitAt;

    for (let i = 1; i <= requests; i++) {
      const startTime = Date.now();
      
      try {
        await this.healthCheck();
        results.push({
          request: i,
          success: true,
          status: 200,
          responseTime: Date.now() - startTime
        });
      } catch (error) {
        const status = error instanceof APIClientError ? error.status : 0;
        results.push({
          request: i,
          success: false,
          status,
          responseTime: Date.now() - startTime,
          error: error instanceof APIClientError ? error.message : 'Unknown error'
        });

        if (status === 429 && !rateLimitHit) {
          rateLimitHit = true;
          rateLimitAt = i;
        }
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return {
      results,
      rateLimitHit,
      rateLimitAt
    };
  }
}

export class APIClientError extends Error {
  public readonly apiError: APIError;
  public readonly status: number;

  constructor(apiError: APIError, status: number) {
    super(apiError.error.message);
    this.apiError = apiError;
    this.status = status;
    this.name = 'APIClientError';
  }
}

// Default client instance
export const apiClient = new SwiftRouteAPIClient();

// Utility functions
export function isAPIError(error: any): error is APIClientError {
  return error instanceof APIClientError;
}

export function formatAPIError(error: APIClientError): string {
  return `${error.apiError.error.code}: ${error.apiError.error.message}`;
}

export function getErrorCode(error: APIClientError): string {
  return error.apiError.error.code;
}