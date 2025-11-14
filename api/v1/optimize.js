/**
 * SwiftRoute Route Optimization API Endpoint
 * Proxies requests to the FastAPI optimization service
 */

import { createClient } from '@supabase/supabase-js';
import fetch from 'node-fetch';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FASTAPI_URL = process.env.FASTAPI_URL || 'http://localhost:8000';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

/**
 * Extract API key from request headers
 */
function extractAPIKey(headers) {
  const authHeader = headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  const apiKeyHeader = headers['x-api-key'];
  if (apiKeyHeader) {
    return apiKeyHeader;
  }
  
  return null;
}

/**
 * Validate API key and get client information
 */
async function validateAPIKey(apiKey) {
  try {
    const { data, error } = await supabase.rpc('validate_api_key', {
      api_key: apiKey
    });
    
    if (error || !data || data.length === 0) {
      return null;
    }
    
    return data[0];
  } catch (error) {
    console.error('API key validation error:', error);
    return null;
  }
}

/**
 * Check rate limits for the API key
 */
async function checkRateLimit(keyId, billingTier) {
  const rateLimits = {
    starter: { limit: 10, window: 60 },
    professional: { limit: 50, window: 60 },
    enterprise: { limit: 200, window: 60 }
  };

  const currentLimit = rateLimits[billingTier] || rateLimits.starter;
  
  // Check current usage in the last minute
  const oneMinuteAgo = new Date(Date.now() - 60000);
  const { data: recentUsage } = await supabase
    .from('usage_records')
    .select('id')
    .eq('api_key_id', keyId)
    .gte('created_at', oneMinuteAgo.toISOString());

  const currentUsage = recentUsage?.length || 0;
  const remaining = Math.max(0, currentLimit.limit - currentUsage);
  const allowed = currentUsage < currentLimit.limit;

  return {
    allowed,
    limit: currentLimit.limit,
    remaining,
    reset_time: Math.floor((Date.now() + 60000) / 1000),
    current_usage: currentUsage
  };
}

/**
 * Record API usage for billing and analytics
 */
async function recordUsage(keyId, endpoint, requestData, responseTimeMs, success, errorCode = null) {
  try {
    const { error } = await supabase
      .from('usage_records')
      .insert({
        api_key_id: keyId,
        endpoint,
        request_data: requestData,
        response_time_ms: responseTimeMs,
        success,
        error_code: errorCode,
        created_at: new Date().toISOString()
      });

    if (error) {
      console.error('Usage recording error:', error);
    }

    // Update last_used_at for the API key
    await supabase
      .from('api_keys')
      .update({ last_used_at: new Date().toISOString() })
      .eq('id', keyId);

  } catch (error) {
    console.error('Usage recording error:', error);
  }
}

/**
 * Validate route optimization request
 */
function validateRouteRequest(body) {
  const errors = [];

  if (!body.origin) {
    errors.push('origin is required');
  } else {
    if (typeof body.origin.lat !== 'number' || body.origin.lat < -90 || body.origin.lat > 90) {
      errors.push('origin.lat must be a number between -90 and 90');
    }
    if (typeof body.origin.lng !== 'number' || body.origin.lng < -180 || body.origin.lng > 180) {
      errors.push('origin.lng must be a number between -180 and 180');
    }
  }

  if (!body.destination) {
    errors.push('destination is required');
  } else {
    if (typeof body.destination.lat !== 'number' || body.destination.lat < -90 || body.destination.lat > 90) {
      errors.push('destination.lat must be a number between -90 and 90');
    }
    if (typeof body.destination.lng !== 'number' || body.destination.lng < -180 || body.destination.lng > 180) {
      errors.push('destination.lng must be a number between -180 and 180');
    }
  }

  if (body.vehicle_type && !['car', 'truck', 'van', 'motorcycle'].includes(body.vehicle_type)) {
    errors.push('vehicle_type must be one of: car, truck, van, motorcycle');
  }

  if (body.optimization_preference && !['distance', 'time', 'cost'].includes(body.optimization_preference)) {
    errors.push('optimization_preference must be one of: distance, time, cost');
  }

  return errors;
}

/**
 * Route optimization handler
 */
export async function optimizeRoute(req, res) {
  const startTime = Date.now();
  const requestId = `req_${startTime}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    // Extract and validate API key
    const apiKey = extractAPIKey(req.headers);
    
    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key required. Provide in Authorization header or X-API-Key header.',
          details: null
        },
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Validate API key
    const keyInfo = await validateAPIKey(apiKey);
    if (!keyInfo) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Invalid or expired API key',
          details: null
        },
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Check rate limits
    const rateLimit = await checkRateLimit(keyInfo.key_id, keyInfo.billing_tier);
    
    // Add rate limit headers
    res.set({
      'X-RateLimit-Limit': rateLimit.limit.toString(),
      'X-RateLimit-Remaining': rateLimit.remaining.toString(),
      'X-RateLimit-Reset': rateLimit.reset_time.toString()
    });

    if (!rateLimit.allowed) {
      // Record failed usage due to rate limit
      await recordUsage(
        keyInfo.key_id,
        '/optimize',
        req.body,
        Date.now() - startTime,
        false,
        'RATE_LIMIT_EXCEEDED'
      );

      return res.status(429).json({
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          message: `Rate limit exceeded. Limit: ${rateLimit.limit} requests per minute`,
          details: {
            limit: rateLimit.limit,
            remaining: rateLimit.remaining,
            reset_time: rateLimit.reset_time,
            retry_after: 60
          }
        },
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Validate request body
    const validationErrors = validateRouteRequest(req.body);
    if (validationErrors.length > 0) {
      await recordUsage(
        keyInfo.key_id,
        '/optimize',
        req.body,
        Date.now() - startTime,
        false,
        'INVALID_REQUEST'
      );

      return res.status(400).json({
        error: {
          code: 'INVALID_REQUEST',
          message: 'Request validation failed',
          details: validationErrors
        },
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }

    // Prepare request for FastAPI service
    const fastApiRequest = {
      ...req.body,
      vehicle_type: req.body.vehicle_type || 'car',
      optimization_preference: req.body.optimization_preference || 'time'
    };

    // Forward request to FastAPI service
    let fastApiResponse;
    try {
      console.log(`Forwarding request to FastAPI: ${FASTAPI_URL}/optimize`);
      
      const response = await fetch(`${FASTAPI_URL}/optimize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': apiKey,  // Use X-API-Key header
          'X-Request-ID': requestId
        },
        body: JSON.stringify(fastApiRequest)
      });

      console.log(`FastAPI response status: ${response.status}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('FastAPI error response:', errorData);
        throw new Error(`FastAPI service error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      fastApiResponse = await response.json();
      console.log('FastAPI response received successfully');
    } catch (error) {
      console.error('FastAPI service error:', error);
      
      // Record failed usage
      await recordUsage(
        keyInfo.key_id,
        '/optimize',
        req.body,
        Date.now() - startTime,
        false,
        'SERVICE_ERROR'
      );

      // Return fallback response
      return res.status(503).json({
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'Route optimization service temporarily unavailable',
          details: error.message || 'Please try again in a few moments'
        },
        request_id: requestId,
        timestamp: new Date().toISOString()
      });
    }

    const responseTime = Date.now() - startTime;

    // Record successful usage
    await recordUsage(
      keyInfo.key_id,
      '/optimize',
      req.body,
      responseTime,
      true
    );

    // Prepare response with additional metadata
    const response = {
      data: fastApiResponse.data || fastApiResponse,
      metadata: {
        processing_time: responseTime,
        algorithm_used: fastApiResponse.metadata?.algorithm_used || 'unknown',
        request_id: requestId,
        service_version: '1.0.0'
      },
      usage: {
        requests_remaining: rateLimit.remaining - 1,
        billing_tier: keyInfo.billing_tier,
        reset_time: rateLimit.reset_time
      },
      request_id: requestId,
      timestamp: new Date().toISOString()
    };

    res.json(response);

  } catch (error) {
    console.error('Route optimization error:', error);
    
    const responseTime = Date.now() - startTime;
    
    // Try to record failed usage if we have key info
    if (req.keyInfo) {
      await recordUsage(
        req.keyInfo.key_id,
        '/optimize',
        req.body,
        responseTime,
        false,
        'INTERNAL_ERROR'
      );
    }

    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null
      },
      request_id: requestId,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Batch route optimization handler (future feature)
 */
export async function batchOptimizeRoutes(req, res) {
  const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  res.status(501).json({
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Batch optimization not yet implemented',
      details: 'This feature will be available in a future release'
    },
    request_id: requestId,
    timestamp: new Date().toISOString()
  });
}

/**
 * Main handler function
 */
export default async function handler(req, res) {
  if (req.method === 'POST') {
    if (req.path === '/batch' || req.url.includes('/batch')) {
      return batchOptimizeRoutes(req, res);
    } else {
      return optimizeRoute(req, res);
    }
  } else {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed`,
        details: 'Only POST method is supported'
      },
      request_id: requestId,
      timestamp: new Date().toISOString()
    });
  }
}