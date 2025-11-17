/**
 * SwiftRoute Billing API - Subscription Management
 * Handles: /subscription, /history, /upgrade
 * Note: Stripe checkout is handled client-side due to network restrictions
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
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

    // Route based on URL path
    const path = req.url.split('?')[0];

    // GET /api/v1/billing/subscription
    if (path.includes('/subscription') && req.method === 'GET') {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .single();

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

    // GET /api/v1/billing/history
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
        metadata: {
          total: billingRecords?.length || 0
        }
      });
    }

    // POST /api/v1/billing/upgrade
    // Note: Actual payment is handled client-side with Stripe.js
    // This endpoint just updates the subscription after payment confirmation
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

      // Update subscription in database
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
      error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
    });

  } catch (error) {
    console.error('Billing API error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: error.message }
    });
  }
}
