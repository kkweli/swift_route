/**
 * Analytics Data Types
 * Type definitions for consolidated analytics dashboard
 */

export interface SubscriptionData {
  id: string;
  user_id: string;
  tier: 'trial' | 'starter' | 'professional' | 'enterprise';
  requests_per_minute: number;
  monthly_requests_included: number;
  price_per_request: string;
  payment_status: 'trial' | 'active' | 'past_due' | 'canceled';
  current_period_start: string;
  current_period_end: string;
  requests_used: number;
  requests_remaining: number;
  overage_requests: number;
  overage_cost: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
}

export interface UsageLog {
  id: string;
  endpoint: string;
  method: string;
  status_code: number;
  response_time_ms: number;
  created_at: string;
  error_code?: string;
}

export interface UsageData {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: string;
  current_period_requests: number;
  subscription_tier: string;
  monthly_limit: number;
  recent_logs: UsageLog[];
}

export interface APIKeyData {
  id: string;
  key_prefix: string;
  name: string;
  status: 'active' | 'revoked';
  created_at: string;
  last_used: string | null;
  request_count: number;
}

export interface APIKeysResponse {
  data: APIKeyData[];
  metadata: {
    total: number;
    active: number;
  };
}

export interface AnalyticsData {
  subscription: SubscriptionData | null;
  usage: UsageData | null;
  apiKeys: APIKeysResponse['metadata'] | null;
}

export interface LoadingState {
  subscription: boolean;
  usage: boolean;
  apiKeys: boolean;
}

export interface ErrorState {
  subscription: string | null;
  usage: string | null;
  apiKeys: string | null;
}
