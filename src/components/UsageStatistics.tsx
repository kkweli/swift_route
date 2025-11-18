/**
 * UsageStatistics Component
 * Displays API usage metrics and statistics
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Activity, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { UsageData } from '@/types/analytics';

interface UsageStatisticsProps {
  usage: UsageData | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function UsageStatistics({ usage, isLoading, error, onRetry }: UsageStatisticsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-20 bg-muted animate-pulse rounded" />
                <div className="h-8 w-16 bg-muted animate-pulse rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Failed to Load Usage Data</CardTitle>
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

  if (!usage) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>No Usage Data</CardTitle>
          <CardDescription>Start making API requests to see usage statistics</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const successRate = parseFloat(usage.success_rate);
  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return 'text-green-600';
    if (rate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Usage Statistics
        </CardTitle>
        <CardDescription>API request metrics and performance</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Total Requests */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              <span>Total Requests</span>
            </div>
            <div className="text-3xl font-bold">{usage.total_requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </div>

          {/* Success Rate */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CheckCircle2 className="h-4 w-4" />
              <span>Success Rate</span>
            </div>
            <div className={`text-3xl font-bold ${getSuccessRateColor(successRate)}`}>
              {successRate.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {usage.successful_requests.toLocaleString()} successful
            </p>
          </div>

          {/* Failed Requests */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <XCircle className="h-4 w-4" />
              <span>Failed Requests</span>
            </div>
            <div className="text-3xl font-bold text-red-600">
              {usage.failed_requests.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {((usage.failed_requests / usage.total_requests) * 100).toFixed(1)}% failure rate
            </p>
          </div>

          {/* Current Period */}
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Activity className="h-4 w-4" />
              <span>This Period</span>
            </div>
            <div className="text-3xl font-bold">{usage.current_period_requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              of {usage.monthly_limit.toLocaleString()} limit
            </p>
          </div>
        </div>

        {/* Performance Indicator */}
        {successRate < 95 && (
          <div className="mt-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <strong>Performance Notice:</strong> Your success rate is below 95%. Check your API integration for potential issues.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
