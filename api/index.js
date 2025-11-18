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

// Mask sensitive headers for debugging but avoid printing secrets
function maskHeaderValue(key, value) {
  if (!value) return value;
  const lower = (key || '').toLowerCase();
  if (lower === 'authorization' || lower === 'x-api-key' || lower === 'cookie') {
    // keep a short prefix and mask the rest
    const prefix = value.slice(0, 12);
    return `${prefix}...<masked>`;
  }
  return value;
}

function getSanitizedHeaders(req) {
  const headers = {};
  for (const h of ['user-agent', 'content-type', 'x-forwarded-for', 'origin', 'referer', 'authorization', 'x-api-key']) {
    headers[h] = maskHeaderValue(h, req.headers[h]);
  }
  return headers;
}

// Helper to add a timeout around async operations (useful for Supabase calls)
async function withTimeout(promise, ms = 5000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('TIMEOUT')), ms);
    })
  ]).finally(() => clearTimeout(timer));
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

    // ==================== DEBUG AUTH ENDPOINT ====================
    if (path.includes('/debug-auth')) {
      const authHeader = req.headers.authorization;
      const apiKeyHeader = req.headers['x-api-key'];
      
      const debugInfo = {
        headers_received: {
          authorization: authHeader ? maskHeaderValue('authorization', authHeader) : 'NOT PROVIDED',
          'x-api-key': apiKeyHeader ? `${apiKeyHeader.substring(0, 20)}...` : 'NOT PROVIDED'
        },
        auth_header_format: authHeader ? (authHeader.startsWith('Bearer ') ? 'VALID FORMAT' : 'INVALID FORMAT - must start with "Bearer "') : 'NOT PROVIDED',
        api_key_format: apiKeyHeader ? (apiKeyHeader.startsWith('sk_live_') ? 'VALID FORMAT' : 'UNKNOWN FORMAT') : 'NOT PROVIDED',
        timestamp: new Date().toISOString()
      };
      
      // Try to authenticate
      let authResult = { success: false, method: null, error: null };
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.replace('Bearer ', '');
        try {
          const result = await withTimeout(supabase.auth.getUser(token), 5000);
          const authUser = result?.data?.user;
          const authError = result?.error;

          if (authError) {
            authResult = { success: false, method: 'bearer_token', error: authError.message };
          } else if (authUser) {
            authResult = { success: true, method: 'bearer_token', user_id: authUser.id, email: authUser.email };
          }
        } catch (e) {
          authResult = { success: false, method: 'bearer_token', error: e.message || 'auth timeout' };
        }
      }
      
      if (!authResult.success && apiKeyHeader) {
        const keyHash = hashAPIKey(apiKeyHeader);
        const { data: apiKey, error: keyError } = await supabase
          .from('api_keys')
          .select('id, user_id, status')
          .eq('key_hash', keyHash)
          .eq('status', 'active')
          .single();
        
        if (keyError) {
          authResult = { success: false, method: 'api_key', error: keyError.message };
        } else if (apiKey) {
          authResult = { success: true, method: 'api_key', api_key_id: apiKey.id, user_id: apiKey.user_id };
        }
      }
      
      // Add a helpful server-side hint about Supabase config, but do not expose secrets
      const serverInfo = {
        supabase_url_cfg: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/^(https?:\/\/)/, '') : 'NOT SET',
        internal_auth_present: !!process.env.INTERNAL_AUTH_SECRET
      };

      return res.status(200).json({
        debug: debugInfo,
        server: serverInfo,
        authentication_result: authResult,
        instructions: {
          bearer_token: 'Use header: Authorization: Bearer YOUR_TOKEN',
          api_key: 'Use header: X-API-Key: sk_live_YOUR_KEY'
        }
      });
    }

    // ==================== AUTHENTICATION REQUIRED FOR ALL OTHER ENDPOINTS ====================
    // Support both Bearer token (dashboard) and API key (B2B) authentication
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'];
    
    // DEBUG: Log minimal headers (masked) for troubleshooting — avoid printing secrets
    console.log('=== AUTH DEBUG ===');
    console.log('Path:', path);
    console.log('Authorization header:', authHeader ? 'Present' : 'Missing');
    console.log('X-API-Key header:', apiKeyHeader ? 'Present' : 'Missing');
    try {
      console.log('Sanitized headers:', JSON.stringify(getSanitizedHeaders(req), null, 2));
    } catch (e) {
      // fall back to safe summary
      console.log('Headers could not be stringified for debug');
    }
    console.log('Server SUPABASE_URL:', !!process.env.SUPABASE_URL ? process.env.SUPABASE_URL.replace(/^(https?:\/\/)/, '') : 'Not configured');
    console.log('==================');
    
    let user = null;
    let apiKeyId = null;
    
    // Try Bearer token authentication first (dashboard users)
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      try {
        const result = await withTimeout(supabase.auth.getUser(token), 5000);
        const authUser = result?.data?.user;
        const authError = result?.error;

        if (authError) {
          console.warn('supabase.auth.getUser error', { message: authError.message });
        }

        if (authUser) {
          user = authUser;
        }
      } catch (e) {
        console.warn('supabase.auth.getUser timeout or error', { message: e?.message || e });
      }
    }
    
    // Try API key authentication (B2B clients)
    if (!user && apiKeyHeader) {
      const keyHash = hashAPIKey(apiKeyHeader);
      try {
        const keyResult = await withTimeout(
          supabase
            .from('api_keys')
            .select('id, user_id, status, request_count')
            .eq('key_hash', keyHash)
            .eq('status', 'active')
            .single(),
          5000
        );

        const apiKey = keyResult?.data;
        const keyError = keyResult?.error;

        if (keyError) {
          console.warn('api_keys lookup error', { message: keyError.message });
        }

        if (apiKey) {
          // Get user associated with API key
          try {
            const userResult = await withTimeout(supabase.auth.admin.getUserById(apiKey.user_id), 5000);
            const keyUser = userResult?.data?.user;
            const userError = userResult?.error;

            if (userError) {
              console.warn('auth.admin.getUserById error', { message: userError.message, user_id: apiKey.user_id });
            }

            if (keyUser) {
              user = keyUser;
              apiKeyId = apiKey.id;

              // Update API key usage stats: set last_used and increment request_count safely
              try {
                const newCount = (apiKey.request_count || 0) + 1;
                await withTimeout(
                  supabase
                    .from('api_keys')
                    .update({
                      last_used: new Date().toISOString(),
                      request_count: newCount
                    })
                    .eq('id', apiKey.id),
                  5000
                );
              } catch (e) {
                console.warn('Failed to update api_keys usage stats', e?.message || e);
              }
            }
          } catch (e) {
            console.warn('auth.admin.getUserById timeout or error', { message: e?.message || e, user_id: apiKey.user_id });
          }
        }
      } catch (e) {
        console.warn('api_keys lookup timeout or error', { message: e?.message || e });
      }
    }
    // If authentication failed for both methods, return 401 early to avoid handlers dereferencing `user`
    if (!user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHENTICATED',
          message: 'Authentication required. Provide Authorization: Bearer <token> or X-API-Key: <key>'
        }
      });
    }
    
    // If neither authentication method worked, return 401
    if (!user) {
      return res.status(401).json({
        error: { 
          code: 'UNAUTHORIZED', 
          message: 'Authorization required. Provide either Bearer token or X-API-Key header.' 
        },
        debug_hint: 'Test your credentials at /api/v1/debug-auth'
      });
    }

    // Provide a lightweight /self endpoint (GET) for quickly verifying the user session
    if (path.includes('/self') && req.method === 'GET') {
      try {
        return res.status(200).json({ data: { user_id: user.id, email: user.email } });
      } catch (e) {
        return res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Unable to fetch user session' } });
      }
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
            ...updates
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
            payment_status: stripe_subscription_id ? 'active' : 'pending'
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
        try {
          const keysResult = await withTimeout(
            supabase
              .from('api_keys')
              .select('id, key_prefix, name, created_at, last_used, request_count, status')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false }),
            6000
          );

          const keys = keysResult?.data;
          const keysError = keysResult?.error;

          if (keysError) {
            console.warn('Failed fetching api_keys', { message: keysError.message, user_id: user.id });
            throw keysError;
          }

          return res.status(200).json({
            data: keys,
            metadata: {
              total: keys.length,
              active: keys.filter(k => k.status === 'active').length
            }
          });
        } catch (e) {
          console.warn('api_keys query failed or timed out', { message: e?.message || e, user_id: user.id });
          return res.status(502).json({ error: { code: 'UPSTREAM_TIMEOUT', message: 'Failed to fetch API keys in time' } });
        }
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

      // POST /keys/regenerate - Regenerate an existing API key (returns new full key once)
      if (path.includes('/keys/regenerate') && req.method === 'POST') {
        const { id } = req.body || {};

        if (!id) {
          return res.status(400).json({ error: { code: 'MISSING_ID', message: 'API key id is required' } });
        }

        // Ensure the key belongs to the requesting user
        const { data: existingKey, error: getError } = await supabase
          .from('api_keys')
          .select('id, user_id, status')
          .eq('id', id)
          .single();

        if (getError || !existingKey) {
          return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API key not found' } });
        }

        if (existingKey.user_id !== user.id) {
          return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this API key' } });
        }

        if (existingKey.status !== 'active') {
          return res.status(400).json({ error: { code: 'INVALID_STATUS', message: 'Only active keys can be regenerated' } });
        }

        // Create a new key, update DB with its hash and prefix, and return the full key once
        const newApiKey = generateAPIKey();
        const newKeyHash = hashAPIKey(newApiKey);
        const newKeyPrefix = newApiKey.substring(0, 15) + '...';

        const { data: updatedKey, error: updateError } = await supabase
          .from('api_keys')
          .update({ key_hash: newKeyHash, key_prefix: newKeyPrefix })
          .eq('id', id)
          .select()
          .single();

        if (updateError) {
          return res.status(500).json({ error: { code: 'UPDATE_FAILED', message: updateError.message } });
        }

        return res.status(200).json({
          data: {
            id: updatedKey.id,
            key: newApiKey,
            key_prefix: newKeyPrefix
          },
          message: 'API key regenerated. Save this key now - it will not be shown again.'
        });
      }

      // DELETE /keys/:id - Revoke/Delete an API key owned by the user
      const deleteMatch = path.match(/\/keys\/([^\/\?#]+)/);
      if (deleteMatch && req.method === 'DELETE') {
        const keyId = deleteMatch[1];

        // Ensure the key exists and belongs to the requesting user
        const { data: existingKey, error: getError } = await supabase
          .from('api_keys')
          .select('id, user_id, status')
          .eq('id', keyId)
          .single();

        if (getError || !existingKey) {
          return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'API key not found' } });
        }

        if (existingKey.user_id !== user.id) {
          console.warn('Revoke attempt by non-owner', { keyId, owner: existingKey.user_id, requester: user?.id });
          return res.status(403).json({ error: { code: 'FORBIDDEN', message: 'You do not own this API key' } });
        }

        // Log context for debugging before attempting revoke
        console.info('Revoking API key', { keyId, owner: existingKey.user_id, requester: user.id });

        // Mark the key as revoked (do not permanently delete to keep audit trail)
        try {
          const { data: revoked, error: revokeError } = await supabase
            .from('api_keys')
            .update({ status: 'revoked' })
            .eq('id', keyId)
            .select()
            .single();

          if (revokeError) {
            console.error('Supabase revokeError', revokeError);
            return res.status(500).json({ error: { code: 'REVOKE_FAILED', message: revokeError.message || 'Failed to revoke API key' } });
          }

          console.info('API key revoked', { id: revoked.id, status: revoked.status });
          return res.status(200).json({ data: { id: revoked.id, status: revoked.status }, message: 'API key revoked' });
        } catch (err) {
          console.error('Unexpected error when revoking API key', err?.message || err);
          return res.status(500).json({ error: { code: 'REVOKE_EXCEPTION', message: 'Unexpected error while revoking API key' } });
        }
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
        // Forward request to Python handler with internal auth token
        const pythonEndpoint = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}/api/v1/optimize-route/internal`;
        
        const pythonResponse = await fetch(pythonEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Internal-Auth': process.env.INTERNAL_AUTH_SECRET || 'internal-secret-key',
          },
          body: JSON.stringify(req.body)
        });

        const rawText = await pythonResponse.text();
        let responseData;
        try {
          responseData = JSON.parse(rawText);
        } catch (parseErr) {
          // Python handler returned non-JSON (likely an HTML error page). Truncate and mask for logs.
          const snippet = rawText ? rawText.substring(0, 2000) : '';
          console.error('Python handler returned non-JSON response', { status: pythonResponse.status, snippet: snippet.slice(0, 500) });
          responseData = {
            error: {
              code: 'INVALID_PYTHON_RESPONSE',
              message: 'Non-JSON response from python handler',
              body_snippet: snippet
            }
          };
        }

        const responseTime = Date.now() - startTime;
        const success = pythonResponse.ok && !responseData.error;

        // If the python handler returned a server error, log a short body snippet for debugging
        if (!pythonResponse.ok) {
          const snippet = rawText ? rawText.substring(0, 1000) : '';
          console.error('Python handler error response', { status: pythonResponse.status, snippet: snippet.slice(0, 500) });
        }

        // Log usage to database (includes api_key_id if using API key auth)
        await supabase
          .from('usage_logs')
          .insert({
            user_id: user.id,
            api_key_id: apiKeyId, // null for dashboard users, set for API key users
            endpoint: '/api/v1/optimize-route',
            method: 'POST',
            status_code: pythonResponse.status,
            response_time_ms: responseTime,
            error_code: success ? null : (responseData.error && responseData.error.code) || 'PYTHON_ERROR'
          });

        // Return the Python response (or synthesized error object)
        return res.status(pythonResponse.status).json(responseData);

      } catch (error) {
        console.error('Route optimization error:', error);
        
        // Log failed request
        await supabase
          .from('usage_logs')
          .insert({
            user_id: user.id,
            api_key_id: apiKeyId, // null for dashboard users, set for API key users
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
