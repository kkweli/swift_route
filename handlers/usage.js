/**
 * SwiftRoute Usage API - Usage Statistics
 * Handles: GET /usage
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Only support GET method
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${req.method} not allowed` }
      });
    }

    // Authenticate user
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

    // Fetch usage logs for the user
    const { data: usageLogs, error } = await supabase
      .from('usage_logs')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) throw error;

    // Calculate statistics
    const totalRequests = usageLogs?.length || 0;
    const successfulRequests = usageLogs?.filter(log => log.success).length || 0;
    const failedRequests = totalRequests - successfulRequests;

    // Get subscription info for context
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('tier, monthly_requests_included, current_period_start, current_period_end')
      .eq('user_id', user.id)
      .single();

    // Calculate current period usage if subscription exists
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

  } catch (error) {
    console.error('Usage API error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: error.message }
    });
  }
}
