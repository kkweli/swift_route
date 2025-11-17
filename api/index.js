/**
 * SwiftRoute Unified API Handler
 * ALL endpoints consolidated into single function to stay under Vercel Hobby plan limit (12 functions)
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Utility functions
function generateAPIKey() {
  const prefix = 'sk_live_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return prefix + randomBytes;
}

function hashAPIKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

export default async function handler(req, res) {
  // Enable CORS for all endpoints
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const path = req.url?.split('?')[0] || '';
  const startTime = Date.now();

  try {
    // ==================== HEALTH ENDPOINT ====================
    if (path.includes('/health')) {
      if (req.method !== 'GET') {
        return res.status(405).json({
          error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${req.method} not allowed` },
          timestamp: new Date().toISOString()
        });
      }

      const responseTime = Date.now() - startTime;
      const hasAPIKey = req.headers.authorization || req.headers['x-api-key'];
      
      return res.status(200).json({
        data: {
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0',
          services: {
            database: 'operational',
            authentication: hasAPIKey ? 'authenticated' : 'public',
            api: 'operational'
          }
        },
        metadata: {
          processing_time: responseTime,
          algorithm_used: 'none',
          request_id: `health_${Date.now()}`
        },
        timestamp: new Date().toISOString()
      });
    }

    // ==================== AUTHENTICATION REQUIRED FOR ALL OTHER ENDPOINTS ====================
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
      });
    }

    // ==================== PROFILE ENDPOINTS ====================
    if (path.includes('/profile')) {
      // GET /profile
      if (req.method === 'GET') {
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error && error.code === 'PGRST116') {
          return res.status(200).json({
            data: {
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || null,
              created_at: user.created_at
            }
          });
        }

        if (error) throw error;

        return res.status(200).json({ data: profile });
      }

      // PUT /profile
      if (req.method === 'PUT') {
        const updates = req.body;

        const { data: profile, error } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            ...updates,
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json({
          data: profile,
          message: 'Profile updated successfully'
        });
      }

      return res.status(405).json({
        error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${req.method} not allowed` }
      });
    }

    // ==================== USAGE ENDPOINT ====================
    if (path.includes('/usage')) {
      if (req.method !== 'GET') {
        return res.status(405).json({
          error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${req.method} not allowed` }
        });
      }

      const { data: usageLogs, error } = await supabase
        .from('usage_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const totalRequests = usageLogs?.length || 0;
      const successfulRequests = usageLogs?.filter(log => log.status_code >= 200 && log.status_code < 300).length || 0;
      const failedRequests = totalRequests - successfulRequests;

      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('tier, monthly_requests_included, current_period_start, current_period_end')
        .eq('user_id', user.id)
        .single();

      let currentPeriodRequests = 0;
      if (subscription) {
        const { data: periodLogs } = await supabase
          .from('usage_logs')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', subscription.current_period_start)
          .lte('created_at', subscription.current_period_end);

        currentPeriodRequests = periodLogs?.length || 0;
      }

      return res.status(200).json({
        data: {
          total_requests: totalRequests,
          successful_requests: successfulRequests,
          failed_requests: failedRequests,
          success_rate: totalRequests > 0 ? (successfulRequests / totalRequests * 100).toFixed(2) : 0,
          current_period_requests: currentPeriodRequests,
          subscription_tier: subscription?.tier || 'trial',
          monthly_limit: subscription?.monthly_requests_included || 100,
          recent_logs: usageLogs?.slice(0, 10) || []
        }
      });
    }

    // ==================== BILLING ENDPOINTS ====================
    if (path.includes('/billing')) {
      // GET /billing/subscription
      if (path.includes('/subscription') && req.method === 'GET') {
        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .select('*')
          .eq('user_id', user.id)
          .single();

        // If no subscription exists, create a trial subscription
        if (error && error.code === 'PGRST116') {
          const { data: newSubscription, error: createError } = await supabase
            .from('subscriptions')
            .insert({
              user_id: user.id,
              tier: 'trial',
              requests_per_minute: 5,
              monthly_requests_included: 100,
              price_per_request: '0.00',
              payment_status: 'trial',
              current_period_start: new Date().toISOString(),
              current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
            .select()
            .single();

          if (createError) throw createError;

          return res.status(200).json({
            data: {
              ...newSubscription,
              requests_used: 0,
              requests_remaining: 100,
              overage_requests: 0,
              overage_cost: '0.00',
              estimated_total: '0.00'
            }
          });
        }

        if (error) throw error;

        const { data: usageLogs } = await supabase
          .from('usage_logs')
          .select('id')
          .eq('user_id', user.id)
          .gte('created_at', subscription.current_period_start)
          .lte('created_at', subscription.current_period_end);

        const requestsUsed = usageLogs?.length || 0;
        const overageRequests = Math.max(0, requestsUsed - subscription.monthly_requests_included);
        const overageCost = overageRequests * parseFloat(subscription.price_per_request);

        return res.status(200).json({
          data: {
            ...subscription,
            requests_used: requestsUsed,
            requests_remaining: Math.max(0, subscription.monthly_requests_included - requestsUsed),
            overage_requests: overageRequests,
            overage_cost: overageCost.toFixed(2),
            estimated_total: overageCost.toFixed(2)
          }
        });
      }

      // GET /billing/history
      if (path.includes('/history') && req.method === 'GET') {
        const { data: billingRecords, error } = await supabase
          .from('billing_records')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (error) throw error;

        return res.status(200).json({
          data: billingRecords || [],
          metadata: { total: billingRecords?.length || 0 }
        });
      }

      // POST /billing/upgrade
      if (path.includes('/upgrade') && req.method === 'POST') {
        const { tier, stripe_customer_id, stripe_subscription_id } = req.body;

        if (!['starter', 'professional', 'enterprise'].includes(tier)) {
          return res.status(400).json({
            error: { code: 'INVALID_TIER', message: 'Invalid subscription tier' }
          });
        }

        const tierConfig = {
          starter: { requests_per_minute: 10, monthly_requests: 1000, price: 0.01 },
          professional: { requests_per_minute: 50, monthly_requests: 10000, price: 0.008 },
          enterprise: { requests_per_minute: 200, monthly_requests: 100000, price: 0.005 }
        };

        const config = tierConfig[tier];

        const { data: subscription, error } = await supabase
          .from('subscriptions')
          .update({
            tier,
            requests_per_minute: config.requests_per_minute,
            monthly_requests_included: config.monthly_requests,
            price_per_request: config.price,
            stripe_customer_id: stripe_customer_id || null,
            stripe_subscription_id: stripe_subscription_id || null,
            payment_status: stripe_subscription_id ? 'active' : 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;

        return res.status(200).json({
          data: subscription,
          message: `Successfully upgraded to ${tier} tier`
        });
      }

      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Billing endpoint not found' }
      });
    }

    // ==================== API KEYS ENDPOINTS ====================
    if (path.includes('/keys')) {
      // GET /keys - List API keys
      if (req.method === 'GET') {
        const { data: keys, error } = await supabase
          .from('api_keys')
          .select('id, key_prefix, name, created_at, last_used, request_count, status')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        return res.status(200).json({
          data: keys,
          metadata: {
            total: keys.length,
            active: keys.filter(k => k.status === 'active').length
          }
        });
      }

      // POST /keys - Create API key
      if (req.method === 'POST') {
        const { data: subscription, error: subError } = await supabase
          .from('subscriptions')
          .select('tier')
          .eq('user_id', user.id)
          .single();

        if (subError || !subscription) {
          return res.status(403).json({
            error: {
              code: 'SUBSCRIPTION_REQUIRED',
              message: 'Active subscription required to create API keys'
            }
          });
        }

        if (subscription.tier === 'trial') {
          return res.status(403).json({
            error: {
              code: 'PAID_SUBSCRIPTION_REQUIRED',
              message: 'Paid subscription required to create custom API keys. Trial users can only use auto-generated trial keys.'
            }
          });
        }

        const keyName = req.body?.name || 'API Key';
        const apiKey = generateAPIKey();
        const keyHash = hashAPIKey(apiKey);
        const keyPrefix = apiKey.substring(0, 15) + '...';

        const { data: newKey, error } = await supabase
          .from('api_keys')
          .insert({
            user_id: user.id,
            key_hash: keyHash,
            key_prefix: keyPrefix,
            name: keyName,
            status: 'active'
          })
          .select()
          .single();

        if (error) throw error;

        return res.status(201).json({
          data: {
            id: newKey.id,
            key: apiKey,
            key_prefix: keyPrefix,
            name: newKey.name,
            created_at: newKey.created_at,
            status: newKey.status
          },
          message: 'API key created successfully. Save this key - it will not be shown again!'
        });
      }

      return res.status(405).json({
        error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${req.method} not allowed` }
      });
    }

    // ==================== ROUTE OPTIMIZATION PROXY ====================
    if (path.includes('/optimize-route') || path.includes('/optimize')) {
      if (req.method !== 'POST') {
        return res.status(405).json({
          error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${req.method} not allowed` }
        });
      }

      try {
        // Forward request to Python handler
        const pythonEndpoint = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/v1/optimize-route`;
        
        const pythonResponse = await fetch(pythonEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(req.body)
        });

        const responseData = await pythonResponse.json();
        const responseTime = Date.now() - startTime;
        const success = pythonResponse.ok;

        // Log usage to database
        await supabase
          .from('usage_logs')
          .insert({
            user_id: user.id,
            endpoint: '/api/v1/optimize-route',
            method: 'POST',
            status_code: pythonResponse.status,
            response_time_ms: responseTime,
            error_code: success ? null : responseData.error?.code
          });

        // Return the Python response
        return res.status(pythonResponse.status).json(responseData);

      } catch (error) {
        console.error('Route optimization error:', error);
        
        // Log failed request
        await supabase
          .from('usage_logs')
          .insert({
            user_id: user.id,
            endpoint: '/api/v1/optimize-route',
            method: 'POST',
            status_code: 500,
            response_time_ms: Date.now() - startTime,
            error_code: 'PROXY_ERROR'
          });

        return res.status(500).json({
          error: {
            code: 'OPTIMIZATION_ERROR',
            message: 'Failed to process route optimization',
            details: error.message
          }
        });
      }
    }

    // ==================== NOT FOUND ====================
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
    });

  } catch (error) {
    console.error('API error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: error.message }
    });
  }
}
