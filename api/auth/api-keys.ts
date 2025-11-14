/**
 * SwiftRoute API Key Management
 * Functions for creating, managing, and validating API keys
 */

import { createClient } from '@supabase/supabase-js';

// Environment variables
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Create Supabase client with service role key
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export interface APIClient {
  id: string;
  email: string;
  company_name?: string;
  billing_tier: 'starter' | 'professional' | 'enterprise';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface APIKey {
  id: string;
  client_id: string;
  key_name: string;
  is_active: boolean;
  created_at: string;
  last_used_at?: string;
  expires_at?: string;
}

export interface CreateAPIClientRequest {
  email: string;
  company_name?: string;
  billing_tier?: 'starter' | 'professional' | 'enterprise';
}

export interface CreateAPIKeyRequest {
  client_id: string;
  key_name?: string;
  expires_at?: string;
}

/**
 * Create a new API client
 */
export async function createAPIClient(request: CreateAPIClientRequest): Promise<{
  success: boolean;
  client?: APIClient;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('api_clients')
      .insert({
        email: request.email,
        company_name: request.company_name,
        billing_tier: request.billing_tier || 'starter'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create API client:', error);
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      client: data
    };

  } catch (error) {
    console.error('API client creation exception:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

/**
 * Create a new API key for a client
 */
export async function createAPIKey(request: CreateAPIKeyRequest): Promise<{
  success: boolean;
  apiKey?: string;
  keyInfo?: APIKey;
  error?: string;
}> {
  try {
    // Generate new API key
    const { data: generatedKey, error: keyGenError } = await supabase
      .rpc('generate_api_key');

    if (keyGenError || !generatedKey) {
      console.error('Failed to generate API key:', keyGenError);
      return {
        success: false,
        error: 'Failed to generate API key'
      };
    }

    // Hash the API key for storage
    const { data: hashedKey, error: hashError } = await supabase
      .rpc('hash_api_key', { api_key: generatedKey });

    if (hashError || !hashedKey) {
      console.error('Failed to hash API key:', hashError);
      return {
        success: false,
        error: 'Failed to process API key'
      };
    }

    // Store the hashed key in database
    const { data: keyRecord, error: insertError } = await supabase
      .from('api_keys')
      .insert({
        client_id: request.client_id,
        key_hash: hashedKey,
        key_name: request.key_name || 'Default Key',
        expires_at: request.expires_at
      })
      .select()
      .single();

    if (insertError) {
      console.error('Failed to store API key:', insertError);
      return {
        success: false,
        error: insertError.message
      };
    }

    return {
      success: true,
      apiKey: generatedKey, // Return the plain key only once
      keyInfo: keyRecord
    };

  } catch (error) {
    console.error('API key creation exception:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

/**
 * Get API client by ID
 */
export async function getAPIClient(clientId: string): Promise<{
  success: boolean;
  client?: APIClient;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('api_clients')
      .select('*')
      .eq('id', clientId)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      client: data
    };

  } catch (error) {
    console.error('Get API client exception:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

/**
 * Get API client by email
 */
export async function getAPIClientByEmail(email: string): Promise<{
  success: boolean;
  client?: APIClient;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('api_clients')
      .select('*')
      .eq('email', email)
      .single();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      client: data
    };

  } catch (error) {
    console.error('Get API client by email exception:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

/**
 * List API keys for a client
 */
export async function listAPIKeys(clientId: string): Promise<{
  success: boolean;
  keys?: APIKey[];
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('api_keys')
      .select('id, client_id, key_name, is_active, created_at, last_used_at, expires_at')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      keys: data
    };

  } catch (error) {
    console.error('List API keys exception:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

/**
 * Deactivate an API key
 */
export async function deactivateAPIKey(keyId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const { error } = await supabase
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', keyId);

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true
    };

  } catch (error) {
    console.error('Deactivate API key exception:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

/**
 * Update API client billing tier
 */
export async function updateClientBillingTier(
  clientId: string, 
  billingTier: 'starter' | 'professional' | 'enterprise'
): Promise<{
  success: boolean;
  client?: APIClient;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('api_clients')
      .update({ 
        billing_tier: billingTier,
        updated_at: new Date().toISOString()
      })
      .eq('id', clientId)
      .select()
      .single();

    if (error) {
      return {
        success: false,
        error: error.message
      };
    }

    return {
      success: true,
      client: data
    };

  } catch (error) {
    console.error('Update billing tier exception:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}

/**
 * Get API usage statistics for a client
 */
export async function getAPIUsageStats(clientId: string, days: number = 30): Promise<{
  success: boolean;
  stats?: {
    total_requests: number;
    successful_requests: number;
    failed_requests: number;
    avg_response_time: number;
    daily_usage: Array<{
      date: string;
      requests: number;
      success_rate: number;
    }>;
  };
  error?: string;
}> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get overall stats
    const { data: overallStats, error: statsError } = await supabase
      .from('api_usage_analytics')
      .select('total_requests, successful_requests, failed_requests, avg_response_time_ms')
      .eq('client_id', clientId)
      .gte('usage_date', startDate.toISOString().split('T')[0]);

    if (statsError) {
      return {
        success: false,
        error: statsError.message
      };
    }

    // Calculate totals
    const totals = overallStats.reduce((acc, day) => ({
      total_requests: acc.total_requests + (day.total_requests || 0),
      successful_requests: acc.successful_requests + (day.successful_requests || 0),
      failed_requests: acc.failed_requests + (day.failed_requests || 0),
      total_response_time: acc.total_response_time + (day.avg_response_time_ms || 0) * (day.total_requests || 0),
      days_with_data: acc.days_with_data + (day.total_requests > 0 ? 1 : 0)
    }), {
      total_requests: 0,
      successful_requests: 0,
      failed_requests: 0,
      total_response_time: 0,
      days_with_data: 0
    });

    const avgResponseTime = totals.days_with_data > 0 
      ? totals.total_response_time / totals.total_requests 
      : 0;

    // Format daily usage
    const dailyUsage = overallStats.map(day => ({
      date: day.usage_date,
      requests: day.total_requests || 0,
      success_rate: day.total_requests > 0 
        ? (day.successful_requests || 0) / day.total_requests 
        : 0
    }));

    return {
      success: true,
      stats: {
        total_requests: totals.total_requests,
        successful_requests: totals.successful_requests,
        failed_requests: totals.failed_requests,
        avg_response_time: avgResponseTime,
        daily_usage: dailyUsage
      }
    };

  } catch (error) {
    console.error('Get API usage stats exception:', error);
    return {
      success: false,
      error: 'Internal server error'
    };
  }
}