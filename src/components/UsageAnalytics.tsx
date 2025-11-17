/**
 * SwiftRoute Usage Analytics Component
 * Display usage statistics and charts
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, TrendingUp, Clock, AlertCircle, BarChart3 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UsageData {
  total_requests: number;
  successful_requests: number;
  failed_requests: number;
  success_rate: number;
  current_period_requests: number;
  subscription_tier: string;
  monthly_limit: number;
  recent_logs: Array<{
    id: string;
    endpoint: string;
    method: string;
    success: boolean;
    response_time_ms?: number;
    created_at: string;
  }>;
}

export function UsageAnalytics() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUsageData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const response = await fetch('/api/v1/usage', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch usage data');

      const result = await response.json();
      setUsageData(result.data);
    } catch (error) {
      console.error('Error fetching usage data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load usage analytics',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsageData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchUsageData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  if (isLoading && !usageData) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <Activity className="w-12 h-12 animate-pulse mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!usageData) {
    return (
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-muted-foreground">No usage data available</p>
      </div>
    );
  }

  // Calculate average response time from recent logs
  const avgResponseTime = usageData.recent_logs.length > 0
    ? Math.round(
        usageData.recent_logs
          .filter(log => log.response_time_ms)
          .reduce((sum, log) => sum + (log.response_time_ms || 0), 0) / 
        usageData.recent_logs.filter(log => log.response_time_ms).length
      )
    : 0;

  // Calculate usage percentage
  const usagePercentage = (usageData.current_period_requests / usageData.monthly_limit) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Usage Analytics</h2>
        <p className="text-muted-foreground">Monitor your API usage and performance</p>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.total_requests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">All time</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usageData.success_rate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {usageData.successful_requests} successful
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">Average latency</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Current Tier</CardTitle>
            <Badge variant="outline">{usageData.subscription_tier}</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{usageData.current_period_requests}</div>
            <p className="text-xs text-muted-foreground">This period</p>
          </CardContent>
        </Card>
      </div>

      {/* Monthly Usage Monitor */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Usage</CardTitle>
          <CardDescription>
            Current usage: {usageData.current_period_requests} / {usageData.monthly_limit} requests
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress 
            value={usagePercentage} 
            className="h-2"
          />
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">
              {usageData.monthly_limit - usageData.current_period_requests} requests remaining
            </span>
            <span className="text-muted-foreground">
              {usagePercentage.toFixed(1)}% used
            </span>
          </div>
          {usagePercentage > 80 && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <AlertCircle className="w-4 h-4" />
              <span>Approaching monthly limit</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>Last {usageData.recent_logs.length} API requests</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {usageData.recent_logs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No recent activity
              </div>
            ) : (
              usageData.recent_logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={log.success ? 'default' : 'destructive'} className="text-xs">
                        {log.method}
                      </Badge>
                      <span className="font-medium">{log.endpoint}</span>
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {new Date(log.created_at).toLocaleString()}
                      {log.response_time_ms && ` • ${log.response_time_ms}ms`}
                    </div>
                  </div>
                  <Badge variant={log.success ? 'outline' : 'destructive'}>
                    {log.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
