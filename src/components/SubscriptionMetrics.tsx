/**
 * SubscriptionMetrics Component
 * Displays subscription tier, quota, and usage information
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CreditCard, TrendingUp, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { SubscriptionData } from '@/types/analytics';
import { format } from 'date-fns';

interface SubscriptionMetricsProps {
  subscription: SubscriptionData | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function SubscriptionMetrics({ subscription, isLoading, error, onRetry }: SubscriptionMetricsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="h-6 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-48 bg-muted animate-pulse rounded" />
            </div>
            <div className="h-6 w-20 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-4 w-full bg-muted animate-pulse rounded" />
          <div className="h-4 w-3/4 bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Failed to Load Subscription</CardTitle>
          <CardDescription>{error}</CardDescription>
        </CardHeader>
        <CardContent>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Retry
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Subscription Found</CardTitle>
          <CardDescription>Please contact support if this is unexpected</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const usagePercentage = subscription.monthly_requests_included > 0 
    ? (subscription.requests_used / subscription.monthly_requests_included) * 100 
    : 0;
  const isNearLimit = usagePercentage >= 80;
  const isOverLimit = usagePercentage >= 100;

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'trial':
        return 'bg-blue-500';
      case 'starter':
        return 'bg-blue-600';
      case 'professional':
        return 'bg-purple-500';
      case 'enterprise':
        return 'bg-amber-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTierDisplayName = (tier: string) => {
    switch (tier) {
      case 'trial':
        return 'Trial';
      case 'starter':
        return 'Starter';
      case 'professional':
        return 'Professional';
      case 'enterprise':
        return 'Enterprise';
      default:
        return 'Trial';
    }
  };

  const isTrialTier = (tier: string) => tier === 'trial';

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'trial':
        return 'bg-blue-500';
      case 'past_due':
        return 'bg-yellow-500';
      case 'canceled':
        return 'bg-red-500';
      default:
        return isTrialTier(status) ? 'bg-blue-500' : 'bg-green-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Subscription
            </CardTitle>
            <CardDescription>Current plan and usage</CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge className={getTierColor(subscription.tier || 'trial')}>
              {getTierDisplayName(subscription.tier || 'trial')}
            </Badge>
            <Badge className={getStatusColor(subscription.payment_status || (isTrialTier(subscription.tier || 'trial') ? 'trial' : 'active'))}>
              {isTrialTier(subscription.tier || 'trial') ? 'Trial' : (subscription.payment_status ? subscription.payment_status.charAt(0).toUpperCase() + subscription.payment_status.slice(1) : 'Active')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Usage Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Requests Used</span>
            <span className="font-medium">
              {subscription.requests_used.toLocaleString()} / {subscription.monthly_requests_included.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={Math.min(usagePercentage, 100)} 
            className={isOverLimit ? 'bg-red-100' : isNearLimit ? 'bg-yellow-100' : ''}
          />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{usagePercentage.toFixed(1)}% used</span>
            <span>{subscription.requests_remaining.toLocaleString()} remaining</span>
          </div>
        </div>

        {/* Overage Warning */}
        {subscription.overage_requests > 0 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2 text-sm text-yellow-800">
              <TrendingUp className="h-4 w-4" />
              <span className="font-medium">
                {subscription.overage_requests.toLocaleString()} overage requests
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Additional cost: ${subscription.overage_cost}
            </p>
          </div>
        )}

        {/* Billing Period */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>
            Period: {format(new Date(subscription.current_period_start), 'MMM d')} - {format(new Date(subscription.current_period_end), 'MMM d, yyyy')}
          </span>
        </div>

        {/* Rate Limit */}
        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Rate Limit</span>
            <span className="font-medium">{subscription.requests_per_minute} requests/minute</span>
          </div>
        </div>

        {/* Upgrade Button */}
        {subscription.tier !== 'enterprise' && (
          <Button asChild className="w-full">
            <Link to="/pricing">
              Upgrade Plan
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
