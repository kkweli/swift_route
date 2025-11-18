/**
 * RecentActivity Component
 * Displays recent API request activity log
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity } from 'lucide-react';
import { UsageLog } from '@/types/analytics';
import { formatDistanceToNow } from 'date-fns';

interface RecentActivityProps {
  logs: UsageLog[];
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function RecentActivity({ logs, isLoading, error, onRetry }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="space-y-2">
            <div className="h-6 w-32 bg-muted animate-pulse rounded" />
            <div className="h-4 w-48 bg-muted animate-pulse rounded" />
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="space-y-2 flex-1">
                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                <div className="h-3 w-32 bg-muted animate-pulse rounded" />
              </div>
              <div className="h-6 w-16 bg-muted animate-pulse rounded" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="border-destructive">
        <CardHeader>
          <CardTitle className="text-destructive">Failed to Load Activity</CardTitle>
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

  if (!logs || logs.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Recent Activity
          </CardTitle>
          <CardDescription>Your latest API requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No recent activity</p>
            <p className="text-sm mt-1">Make your first API request to see activity here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'bg-green-500';
    if (statusCode >= 400 && statusCode < 500) return 'bg-yellow-500';
    if (statusCode >= 500) return 'bg-red-500';
    return 'bg-gray-500';
  };

  const getStatusVariant = (statusCode: number): "default" | "secondary" | "destructive" | "outline" => {
    if (statusCode >= 200 && statusCode < 300) return 'default';
    if (statusCode >= 400 && statusCode < 500) return 'secondary';
    if (statusCode >= 500) return 'destructive';
    return 'outline';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
        <CardDescription>Your latest API requests (last 10)</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.slice(0, 10).map((log) => (
            <div
              key={log.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant={getStatusVariant(log.status_code)} className="text-xs">
                    {log.status_code}
                  </Badge>
                  <span className="text-sm font-medium truncate">{log.method} {log.endpoint}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                  </span>
                  <span>{log.response_time_ms}ms</span>
                  {log.error_code && (
                    <span className="text-red-600 font-medium">{log.error_code}</span>
                  )}
                </div>
              </div>
              <div className={`w-2 h-2 rounded-full ${getStatusColor(log.status_code)} flex-shrink-0 ml-3`} />
            </div>
          ))}
        </div>

        {logs.length > 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              View All Activity
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
