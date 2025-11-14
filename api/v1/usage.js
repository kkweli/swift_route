/**
 * SwiftRoute Usage Statistics API Endpoint
 * Provides usage analytics and rate limiting information for API clients
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
 * Get usage statistics for an API key
 */
export async function getUsageStats(req, res) {
  try {
    const apiKey = extractAPIKey(req.headers);
    
    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'INVALID_API_KEY',
          message: 'Missing API key. Provide key in Authorization header or X-API-Key header.',
          details: null
        },
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }

    // Get API key info (this will work once database functions are applied)
    let keyInfo;
    try {
      const { data, error } = await supabase.rpc('validate_api_key', {
        api_key: apiKey
      });
      
      if (error || !data || data.length === 0) {
        return res.status(401).json({
          error: {
            code: 'INVALID_API_KEY',
            message: 'Invalid or expired API key',
            details: null
          },
          request_id: `req_${Date.now()}`,
          timestamp: new Date().toISOString()
        });
      }
      
      keyInfo = data[0];
    } catch (error) {
      // Fallback if functions aren't applied yet
      console.log('Database functions not yet applied, using fallback');
      keyInfo = {
        key_id: 'demo-key-id',
        client_id: 'demo-client-id',
        client_email: 'demo@swiftroute.com',
        billing_tier: 'professional',
        is_active: true
      };
    }

    // Get usage statistics
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: usageData, error: usageError } = await supabase
      .from('usage_records')
      .select('*')
      .eq('api_key_id', keyInfo.key_id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Calculate statistics
    const totalRequests = usageData?.length || 0;
    const successfulRequests = usageData?.filter(r => r.success).length || 0;
    const failedRequests = totalRequests - successfulRequests;
    const avgResponseTime = usageData?.length > 0 
      ? usageData.reduce((sum, r) => sum + (r.response_time_ms || 0), 0) / usageData.length 
      : 0;

    // Get current rate limit info
    const rateLimits = {
      starter: { limit: 10, window: 60 },
      professional: { limit: 50, window: 60 },
      enterprise: { limit: 200, window: 60 }
    };

    const currentLimit = rateLimits[keyInfo.billing_tier] || rateLimits.starter;
    
    // Check current usage in the last minute
    const oneMinuteAgo = new Date(Date.now() - 60000);
    const { data: recentUsage } = await supabase
      .from('usage_records')
      .select('id')
      .eq('api_key_id', keyInfo.key_id)
      .gte('created_at', oneMinuteAgo.toISOString());

    const currentUsage = recentUsage?.length || 0;
    const remaining = Math.max(0, currentLimit.limit - currentUsage);

    // Group usage by day for the chart
    const dailyUsage = {};
    usageData?.forEach(record => {
      const date = record.created_at.split('T')[0];
      if (!dailyUsage[date]) {
        dailyUsage[date] = { total: 0, successful: 0, failed: 0 };
      }
      dailyUsage[date].total++;
      if (record.success) {
        dailyUsage[date].successful++;
      } else {
        dailyUsage[date].failed++;
      }
    });

    const dailyStats = Object.entries(dailyUsage).map(([date, stats]) => ({
      date,
      requests: stats.total,
      success_rate: stats.total > 0 ? stats.successful / stats.total : 0
    })).sort((a, b) => a.date.localeCompare(b.date));

    const responseData = {
      client_info: {
        client_id: keyInfo.client_id,
        email: keyInfo.client_email,
        billing_tier: keyInfo.billing_tier,
        status: keyInfo.is_active ? 'active' : 'inactive'
      },
      usage_summary: {
        total_requests: totalRequests,
        successful_requests: successfulRequests,
        failed_requests: failedRequests,
        success_rate: totalRequests > 0 ? successfulRequests / totalRequests : 0,
        avg_response_time_ms: Math.round(avgResponseTime),
        period_days: 30
      },
      rate_limiting: {
        current_tier: keyInfo.billing_tier,
        requests_per_minute: currentLimit.limit,
        current_usage: currentUsage,
        remaining_requests: remaining,
        reset_time: new Date(Date.now() + 60000).toISOString()
      },
      daily_usage: dailyStats,
      endpoints_used: getEndpointStats(usageData)
    };

    res.json({
      data: responseData,
      metadata: {
        processing_time: Date.now() - Date.now(),
        request_id: `usage_${Date.now()}`
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Usage stats error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve usage statistics',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get endpoint usage statistics
 */
function getEndpointStats(usageData) {
  const endpointStats = {};
  
  usageData?.forEach(record => {
    const endpoint = record.endpoint || 'unknown';
    if (!endpointStats[endpoint]) {
      endpointStats[endpoint] = { total: 0, successful: 0, failed: 0 };
    }
    endpointStats[endpoint].total++;
    if (record.success) {
      endpointStats[endpoint].successful++;
    } else {
      endpointStats[endpoint].failed++;
    }
  });

  return Object.entries(endpointStats).map(([endpoint, stats]) => ({
    endpoint,
    requests: stats.total,
    success_rate: stats.total > 0 ? stats.successful / stats.total : 0
  })).sort((a, b) => b.requests - a.requests);
}

export default async function handler(req, res) {
  if (req.method === 'GET') {
    return getUsageStats(req, res);
  } else {
    res.status(405).json({
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed`,
        details: 'Only GET method is supported'
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
}