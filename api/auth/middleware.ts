/**
 * SwiftRoute API Authentication Middleware
 * Handles API key validation and rate limiting
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export interface APIKeyValidation {
  isValid: boolean;
  keyId?: string;
  clientId?: string;
  clientEmail?: string;
  billingTier?: string;
  error?: string;
}

export interface RateLimitInfo {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
  error?: string;
}

/**
 * Extract API key from request headers
 */
export function extractAPIKey(headers: Headers): string | null {
  // Check for API key in Authorization header (Bearer token)
  const authHeader = headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check for API key in X-API-Key header
  const apiKeyHeader = headers.get('x-api-key');
  if (apiKeyHeader) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Validate API key against database
 */
export async function validateAPIKey(apiKey: string): Promise<APIKeyValidation> {
  try {
    if (!apiKey || !apiKey.startsWith('sk_')) {
      return {
        isValid: false,
        error: 'Invalid API key format'
      };
    }

    // Call the database function to validate API key
    const { data, error } = await supabase.rpc('validate_api_key', {
      api_key: apiKey
    });

    if (error) {
      console.error('API key validation error:', error);
      return {
        isValid: false,
        error: 'API key validation failed'
      };
    }

    if (!data || data.length === 0) {
      return {
        isValid: false,
        error: 'Invalid or expired API key'
      };
    }

    const keyInfo = data[0];
    
    if (!keyInfo.is_active) {
      return {
        isValid: false,
        error: 'API key is inactive'
      };
    }

    return {
      isValid: true,
      keyId: keyInfo.key_id,
      clientId: keyInfo.client_id,
      clientEmail: keyInfo.client_email,
      billingTier: keyInfo.billing_tier
    };

  } catch (error) {
    console.error('API key validation exception:', error);
    return {
      isValid: false,
      error: 'Internal server error'
    };
  }
}

/**
 * Check rate limits for API key
 */
export async function checkRateLimit(
  keyId: string, 
  billingTier: string,
  endpoint: string
): Promise<RateLimitInfo> {
  try {
    // Get rate limit for billing tier
    const rateLimits = {
      starter: { limit: 10, window: 60 }, // 10 requests per minute
      professional: { limit: 50, window: 60 }, // 50 requests per minute
      enterprise: { limit: 200, window: 60 } // 200 requests per minute
    };

    const tierLimit = rateLimits[billingTier as keyof typeof rateLimits] || rateLimits.starter;
    
    // Check recent usage from database
    const oneMinuteAgo = new Date(Date.now() - tierLimit.window * 1000).toISOString();
    
    const { data, error } = await supabase
      .from('usage_records')
      .select('id')
      .eq('api_key_id', keyId)
      .gte('created_at', oneMinuteAgo);

    if (error) {
      console.error('Rate limit check error:', error);
      return {
        allowed: false,
        limit: tierLimit.limit,
        remaining: 0,
        resetTime: Date.now() + (tierLimit.window * 1000),
        error: 'Rate limit check failed'
      };
    }

    const currentUsage = data?.length || 0;
    const remaining = Math.max(0, tierLimit.limit - currentUsage);
    const allowed = currentUsage < tierLimit.limit;

    return {
      allowed,
      limit: tierLimit.limit,
      remaining,
      resetTime: Date.now() + (tierLimit.window * 1000)
    };

  } catch (error) {
    console.error('Rate limit check exception:', error);
    return {
      allowed: false,
      limit: 0,
      remaining: 0,
      resetTime: Date.now() + 60000,
      error: 'Internal server error'
    };
  }
}

/**
 * Record API usage for billing and analytics
 */
export async function recordAPIUsage(
  keyId: string,
  endpoint: string,
  requestData: any,
  responseTimeMs: number,
  success: boolean,
  errorCode?: string
): Promise<void> {
  try {
    const { error } = await supabase.rpc('record_api_usage', {
      p_api_key_id: keyId,
      p_endpoint: endpoint,
      p_request_data: requestData,
      p_response_time_ms: responseTimeMs,
      p_success: success,
      p_error_code: errorCode
    });

    if (error) {
      console.error('Failed to record API usage:', error);
    }
  } catch (error) {
    console.error('API usage recording exception:', error);
  }
}

/**
 * Authentication middleware for API routes
 */
export async function authenticateAPIRequest(request: Request): Promise<{
  success: boolean;
  keyInfo?: APIKeyValidation;
  rateLimitInfo?: RateLimitInfo;
  error?: string;
  statusCode?: number;
}> {
  const headers = request.headers;
  
  // Extract API key
  const apiKey = extractAPIKey(headers);
  if (!apiKey) {
    return {
      success: false,
      error: 'Missing API key. Provide key in Authorization header or X-API-Key header.',
      statusCode: 401
    };
  }

  // Validate API key
  const keyValidation = await validateAPIKey(apiKey);
  if (!keyValidation.isValid) {
    return {
      success: false,
      error: keyValidation.error || 'Invalid API key',
      statusCode: 401
    };
  }

  // Check rate limits
  const rateLimitInfo = await checkRateLimit(
    keyValidation.keyId!,
    keyValidation.billingTier!,
    new URL(request.url).pathname
  );

  if (!rateLimitInfo.allowed) {
    return {
      success: false,
      keyInfo: keyValidation,
      rateLimitInfo,
      error: 'Rate limit exceeded',
      statusCode: 429
    };
  }

  return {
    success: true,
    keyInfo: keyValidation,
    rateLimitInfo
  };
}

/**
 * Create standardized API error response
 */
export function createAPIErrorResponse(
  error: string,
  statusCode: number,
  requestId?: string
): Response {
  return new Response(
    JSON.stringify({
      error: {
        code: getErrorCode(statusCode),
        message: error,
        details: null
      },
      request_id: requestId || generateRequestId(),
      timestamp: new Date().toISOString()
    }),
    {
      status: statusCode,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId || generateRequestId()
      }
    }
  );
}

/**
 * Create standardized API success response
 */
export function createAPISuccessResponse(
  data: any,
  metadata?: any,
  usage?: any,
  requestId?: string
): Response {
  return new Response(
    JSON.stringify({
      data,
      metadata: metadata || {},
      usage: usage || {},
      request_id: requestId || generateRequestId(),
      timestamp: new Date().toISOString()
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Request-ID': requestId || generateRequestId()
      }
    }
  );
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Get error code from status code
 */
function getErrorCode(statusCode: number): string {
  const errorCodes = {
    400: 'INVALID_REQUEST',
    401: 'INVALID_API_KEY',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    429: 'RATE_LIMIT_EXCEEDED',
    500: 'INTERNAL_SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE'
  };
  
  return errorCodes[statusCode as keyof typeof errorCodes] || 'UNKNOWN_ERROR';
}