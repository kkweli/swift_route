/**
 * SwiftRoute API Keys Management
 * Vercel Serverless Function
 */

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateAPIKey() {
  const prefix = 'sk_live_';
  const randomBytes = crypto.randomBytes(32).toString('hex');
  return prefix + randomBytes;
}

function hashAPIKey(key) {
  // Use crypto.createHash instead of bcrypt for serverless compatibility
  return crypto.createHash('sha256').update(key).digest('hex');
}

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authorization header required'
        }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid or expired token'
        }
      });
    }

    // Handle GET - List API keys
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

    // Handle POST - Create API key
    if (req.method === 'POST') {
      // Check subscription tier - only paid users can create custom API keys
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

      // Only allow paid tiers to create custom API keys
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
      error: {
        code: 'METHOD_NOT_ALLOWED',
        message: `Method ${req.method} not allowed`
      }
    });

  } catch (error) {
    console.error('API Keys error:', error);
    return res.status(500).json({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Internal server error',
        details: error.message
      }
    });
  }
}
