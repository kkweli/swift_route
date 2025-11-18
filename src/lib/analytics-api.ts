/**
 * Analytics API Client
 * Functions for fetching analytics data from backend endpoints
 */

import { supabase } from '@/integrations/supabase/client';
import { SubscriptionData, UsageData, APIKeysResponse } from '@/types/analytics';

const API_BASE_URL = '/api/v1';

/**
 * Get authentication token from Supabase session
 */
async function getAuthToken(): Promise<string> {
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error || !session) {
    throw new Error('Not authenticated');
  }
  
  return session.access_token;
}

/**
 * Fetch subscription data including usage and billing information
 */
export async function fetchSubscriptionData(): Promise<SubscriptionData> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/billing/subscription`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      if (response.status === 404) {
        throw new Error('Subscription not found. Please contact support.');
      }
      throw new Error(`Failed to fetch subscription: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data) {
      throw new Error('Invalid response format from subscription endpoint');
    }

    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching subscription data');
  }
}

/**
 * Fetch usage statistics and recent activity logs
 */
export async function fetchUsageData(): Promise<UsageData> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/usage`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(`Failed to fetch usage data: ${response.statusText}`);
    }

    const data = await response.json();
    
    if (!data.data) {
      throw new Error('Invalid response format from usage endpoint');
    }

    return data.data;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching usage data');
  }
}

/**
 * Fetch API keys metadata (count and status)
 */
export async function fetchAPIKeysData(): Promise<APIKeysResponse['metadata']> {
  try {
    const token = await getAuthToken();
    
    const response = await fetch(`${API_BASE_URL}/keys`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error(`Failed to fetch API keys: ${response.statusText}`);
    }

    const data: APIKeysResponse = await response.json();
    
    if (!data.metadata) {
      throw new Error('Invalid response format from keys endpoint');
    }

    return data.metadata;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while fetching API keys data');
  }
}

/**
 * Fetch all analytics data in parallel
 */
export async function fetchAllAnalyticsData() {
  try {
    const [subscription, usage, apiKeys] = await Promise.all([
      fetchSubscriptionData(),
      fetchUsageData(),
      fetchAPIKeysData(),
    ]);

    return {
      subscription,
      usage,
      apiKeys,
    };
  } catch (error) {
    // If any request fails, we still want to return partial data
    // Individual components will handle their own errors
    throw error;
  }
}
