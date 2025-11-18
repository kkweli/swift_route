/**
 * Analytics Data Hooks
 * React Query hooks for fetching and caching analytics data
 */

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { 
  fetchSubscriptionData, 
  fetchUsageData, 
  fetchAPIKeysData,
  fetchAllAnalyticsData 
} from '@/lib/analytics-api';
import { SubscriptionData, UsageData, APIKeysResponse, AnalyticsData } from '@/types/analytics';

/**
 * Hook to fetch subscription data
 * Cached for 5 minutes
 */
export function useSubscriptionData(): UseQueryResult<SubscriptionData, Error> {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: fetchSubscriptionData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch usage statistics
 * Cached for 1 minute
 */
export function useUsageData(): UseQueryResult<UsageData, Error> {
  return useQuery({
    queryKey: ['usage'],
    queryFn: fetchUsageData,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch API keys metadata
 * Cached for 5 minutes
 */
export function useAPIKeysData(): UseQueryResult<APIKeysResponse['metadata'], Error> {
  return useQuery({
    queryKey: ['apiKeys'],
    queryFn: fetchAPIKeysData,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

/**
 * Hook to fetch all analytics data in parallel
 * Useful for initial page load
 */
export function useAllAnalyticsData(): UseQueryResult<AnalyticsData, Error> {
  return useQuery({
    queryKey: ['analytics', 'all'],
    queryFn: fetchAllAnalyticsData,
    staleTime: 1 * 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 2000,
  });
}

/**
 * Helper hook to get loading and error states for all analytics data
 */
export function useAnalyticsState() {
  const subscription = useSubscriptionData();
  const usage = useUsageData();
  const apiKeys = useAPIKeysData();

  return {
    isLoading: subscription.isLoading || usage.isLoading || apiKeys.isLoading,
    isError: subscription.isError || usage.isError || apiKeys.isError,
    errors: {
      subscription: subscription.error?.message || null,
      usage: usage.error?.message || null,
      apiKeys: apiKeys.error?.message || null,
    },
    data: {
      subscription: subscription.data || null,
      usage: usage.data || null,
      apiKeys: apiKeys.data || null,
    },
    refetch: {
      subscription: subscription.refetch,
      usage: usage.refetch,
      apiKeys: apiKeys.refetch,
    },
  };
}
