/**
 * SwiftRoute Client Management API Endpoint
 * Provides client and API key management functionality
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
 * Get client profile information
 */
export async function getClientProfile(req, res) {
  try {
    const apiKey = extractAPIKey(req.headers);
    
    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key required',
          details: null
        },
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }

    const keyInfo = await validateAPIKey(apiKey);
    if (!keyInfo) {
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

    // Get client details
    const { data: clientData, error: clientError } = await supabase
      .from('api_clients')
      .select('*')
      .eq('id', keyInfo.client_id)
      .single();

    if (clientError || !clientData) {
      return res.status(404).json({
        error: {
          code: 'CLIENT_NOT_FOUND',
          message: 'Client not found',
          details: null
        },
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }

    // Get API keys for this client
    const { data: apiKeys, error: keysError } = await supabase
      .from('api_keys')
      .select('id, key_name, is_active, last_used_at, expires_at, created_at')
      .eq('client_id', keyInfo.client_id)
      .order('created_at', { ascending: false });

    const responseData = {
      client: {
        id: clientData.id,
        email: clientData.email,
        company_name: clientData.company_name,
        billing_tier: clientData.billing_tier,
        is_active: clientData.is_active,
        created_at: clientData.created_at,
        updated_at: clientData.updated_at
      },
      api_keys: apiKeys?.map(key => ({
        id: key.id,
        name: key.key_name,
        is_active: key.is_active,
        last_used_at: key.last_used_at,
        expires_at: key.expires_at,
        created_at: key.created_at
      })) || [],
      billing_info: getBillingInfo(clientData.billing_tier)
    };

    res.json({
      data: responseData,
      metadata: {
        processing_time: 0,
        request_id: `profile_${Date.now()}`
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Client profile error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to retrieve client profile',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Create a new API key for the client
 */
export async function createAPIKey(req, res) {
  try {
    const apiKey = extractAPIKey(req.headers);
    
    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key required',
          details: null
        },
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }

    const keyInfo = await validateAPIKey(apiKey);
    if (!keyInfo) {
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

    const { key_name = 'API Key' } = req.body;

    // Generate new API key
    const { data: newKeyData, error: keyError } = await supabase.rpc('generate_api_key');
    
    if (keyError || !newKeyData) {
      return res.status(500).json({
        error: {
          code: 'KEY_GENERATION_FAILED',
          message: 'Failed to generate API key',
          details: null
        },
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }

    const newApiKey = newKeyData;

    // Hash the key
    const { data: hashData, error: hashError } = await supabase.rpc('hash_api_key', {
      api_key: newApiKey
    });

    if (hashError || !hashData) {
      return res.status(500).json({
        error: {
          code: 'KEY_HASHING_FAILED',
          message: 'Failed to hash API key',
          details: null
        },
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }

    const keyHash = hashData;

    // Store the key
    const { data: storedKey, error: storeError } = await supabase
      .from('api_keys')
      .insert({
        client_id: keyInfo.client_id,
        key_hash: keyHash,
        key_name: key_name,
        is_active: true
      })
      .select('id, key_name, is_active, created_at')
      .single();

    if (storeError || !storedKey) {
      return res.status(500).json({
        error: {
          code: 'KEY_STORAGE_FAILED',
          message: 'Failed to store API key',
          details: null
        },
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      data: {
        api_key: newApiKey,
        key_info: {
          id: storedKey.id,
          name: storedKey.key_name,
          is_active: storedKey.is_active,
          created_at: storedKey.created_at
        },
        warning: 'Save this API key - it will not be shown again!'
      },
      metadata: {
        processing_time: 0,
        request_id: `create_key_${Date.now()}`
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Create API key error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to create API key',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Deactivate an API key
 */
export async function deactivateAPIKey(req, res) {
  try {
    const apiKey = extractAPIKey(req.headers);
    const { key_id } = req.params;
    
    if (!apiKey) {
      return res.status(401).json({
        error: {
          code: 'MISSING_API_KEY',
          message: 'API key required',
          details: null
        },
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }

    const keyInfo = await validateAPIKey(apiKey);
    if (!keyInfo) {
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

    // Deactivate the key (only if it belongs to the same client)
    const { data: updatedKey, error: updateError } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', key_id)
      .eq('client_id', keyInfo.client_id)
      .select('id, key_name, is_active')
      .single();

    if (updateError || !updatedKey) {
      return res.status(404).json({
        error: {
          code: 'KEY_NOT_FOUND',
          message: 'API key not found or access denied',
          details: null
        },
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      data: {
        message: 'API key deactivated successfully',
        key_info: updatedKey
      },
      metadata: {
        processing_time: 0,
        request_id: `deactivate_key_${Date.now()}`
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Deactivate API key error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Failed to deactivate API key',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Get billing information for a tier
 */
function getBillingInfo(tier) {
  const billingInfo = {
    starter: {
      name: 'Starter',
      requests_per_minute: 10,
      requests_per_month: 1000,
      cost_per_request: 0.01,
      features: ['Basic route optimization', 'Standard support', 'API documentation']
    },
    professional: {
      name: 'Professional',
      requests_per_minute: 50,
      requests_per_month: 10000,
      cost_per_request: 0.008,
      features: ['Advanced route optimization', 'Priority support', 'Usage analytics', 'Batch processing']
    },
    enterprise: {
      name: 'Enterprise',
      requests_per_minute: 200,
      requests_per_month: 100000,
      cost_per_request: 0.005,
      features: ['Premium route optimization', '24/7 support', 'Custom integrations', 'Dedicated account manager']
    }
  };

  return billingInfo[tier] || billingInfo.starter;
}

/**
 * Main handler function
 */
export default async function handler(req, res) {
  const { method } = req;
  const path = req.url || req.path || '';

  try {
    if (method === 'GET' && path.includes('/profile')) {
      return getClientProfile(req, res);
    } else if (method === 'POST' && path.includes('/keys')) {
      return createAPIKey(req, res);
    } else if (method === 'DELETE' && path.includes('/keys/')) {
      return deactivateAPIKey(req, res);
    } else {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: `Endpoint ${method} ${path} not found`,
          details: 'Available endpoints: GET /profile, POST /keys, DELETE /keys/:id'
        },
        request_id: `req_${Date.now()}`,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Client management error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
}