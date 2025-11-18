/**
 * SwiftRoute API Management Dashboard
 * Component for testing and managing API functionality
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Key, 
  BarChart3, 
  Zap,
  AlertTriangle,
  Activity
} from 'lucide-react';
import { SwiftRouteAPIClient, APIClientError, isAPIError } from '@/lib/api-client';

interface APITestResult {
  endpoint: string;
  success: boolean;
  responseTime: number;
  status: number;
  error?: string;
  data?: unknown;
}

interface UsageStats {
  usage_summary: {
    total_requests: number;
    success_rate: number;
    avg_response_time_ms: number;
  };
  client_info: { billing_tier: string };
  rate_limiting: { current_usage: number; requests_per_minute: number };
}

type RateLimitResult = { request: number; success: boolean; responseTime: number; status: number };
type RateLimitTest = { results: RateLimitResult[]; rateLimitAt?: number } | null;

export function APIManagement() {
  const [apiKey, setApiKey] = useState('');
  const [client, setClient] = useState<SwiftRouteAPIClient>(new SwiftRouteAPIClient());
  const [testResults, setTestResults] = useState<APITestResult[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [rateLimitTest, setRateLimitTest] = useState<RateLimitTest>(null);

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('swiftroute_api_key');
    if (savedKey) {
      setApiKey(savedKey);
      client.setAPIKey(savedKey);
    }
  }, [client]);

  const handleAPIKeyChange = (key: string) => {
    setApiKey(key);
    client.setAPIKey(key);
    localStorage.setItem('swiftroute_api_key', key);
  };

  const runHealthCheck = async () => {
    setIsLoading(true);
    const startTime = Date.now();
    
    try {
      const response = await client.healthCheck();
      const responseTime = Date.now() - startTime;
      
      setTestResults(prev => [...prev, {
        endpoint: '/api/v1/health',
        success: true,
        responseTime,
        status: 200,
        data: response.data
      }]);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const status = isAPIError(error) ? error.status : 0;
      
      setTestResults(prev => [...prev, {
        endpoint: '/api/v1/health',
        success: false,
        responseTime,
        status,
        error: isAPIError(error) ? error.message : 'Unknown error'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUsageStats = async () => {
    if (!apiKey) {
      alert('Please enter an API key first');
      return;
    }

    setIsLoading(true);
    try {
      const response = await client.getUsageStats();
      setUsageStats(response.data);
    } catch (error) {
      console.error('Failed to load usage stats:', error);
      alert(isAPIError(error) ? error.message : 'Failed to load usage statistics');
    } finally {
      setIsLoading(false);
    }
  };

  const testRateLimit = async () => {
    if (!apiKey) {
      alert('Please enter an API key first');
      return;
    }

    setIsLoading(true);
    try {
      const results = await client.testRateLimit(15);
      setRateLimitTest(results);
    } catch (error) {
      console.error('Rate limit test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const testAPIKey = async () => {
    if (!apiKey) {
      alert('Please enter an API key first');
      return;
    }

    setIsLoading(true);
    try {
      const result = await client.testAPIKey(apiKey);
      
      setTestResults(prev => [...prev, {
        endpoint: 'API Key Test',
        success: result.valid,
        responseTime: 0,
        status: result.valid ? 200 : 401,
        error: result.error,
        data: result.clientInfo
      }]);
    } catch (error) {
      console.error('API key test failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
    setUsageStats(null);
    setRateLimitTest(null);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">SwiftRoute API Management</h1>
          <p className="text-muted-foreground">Test and manage your SwiftRoute API integration</p>
        </div>
        <Badge variant="outline" className="text-sm">
          <Activity className="w-4 h-4 mr-1" />
          API Server: localhost:3001
        </Badge>
      </div>

      {/* API Key Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Configuration
          </CardTitle>
          <CardDescription>
            Enter your SwiftRoute API key to test authenticated endpoints
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="api-key">API Key</Label>
              <Input
                id="api-key"
                type="password"
                placeholder="sk_..."
                value={apiKey}
                onChange={(e) => handleAPIKeyChange(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <Button onClick={testAPIKey} disabled={isLoading || !apiKey}>
                Test Key
              </Button>
            </div>
          </div>
          
          {apiKey && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                API key configured. You can now test authenticated endpoints.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="testing" className="space-y-4">
        <TabsList>
          <TabsTrigger value="testing">API Testing</TabsTrigger>
          <TabsTrigger value="usage">Usage Statistics</TabsTrigger>
          <TabsTrigger value="rate-limit">Rate Limiting</TabsTrigger>
        </TabsList>

        {/* API Testing Tab */}
        <TabsContent value="testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Testing</CardTitle>
              <CardDescription>
                Test various API endpoints and view responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={runHealthCheck} disabled={isLoading}>
                  <Activity className="w-4 h-4 mr-2" />
                  Test Health Check
                </Button>
                <Button onClick={loadUsageStats} disabled={isLoading || !apiKey}>
                  <BarChart3 className="w-4 h-4 mr-2" />
                  Load Usage Stats
                </Button>
                <Button onClick={clearResults} variant="outline">
                  Clear Results
                </Button>
              </div>

              {/* Test Results */}
              {testResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">Test Results</h4>
                  {testResults.map((result, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <div>
                          <div className="font-medium">{result.endpoint}</div>
                          {result.error && (
                            <div className="text-sm text-red-500">{result.error}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {result.responseTime}ms
                        </div>
                        <Badge variant={result.success ? "default" : "destructive"}>
                          {result.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Statistics Tab */}
        <TabsContent value="usage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>
                View your API usage statistics and billing information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!apiKey ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please configure your API key to view usage statistics.
                  </AlertDescription>
                </Alert>
              ) : usageStats ? (
                <div className="space-y-6">
                  {/* Client Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                                      <div className="text-2xl font-bold">{usageStats.usage_summary.total_requests}</div>
                      <div className="text-sm text-muted-foreground">Total Requests</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(usageStats.usage_summary.success_rate * 100)}%
                      </div>
                      <div className="text-sm text-muted-foreground">Success Rate</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold">{usageStats.usage_summary.avg_response_time_ms}ms</div>
                      <div className="text-sm text-muted-foreground">Avg Response Time</div>
                    </div>
                    <div className="text-center">
                        <Badge variant="outline" className="text-lg px-3 py-1">
                        {usageStats.client_info.billing_tier}
                      </Badge>
                      <div className="text-sm text-muted-foreground">Billing Tier</div>
                    </div>
                  </div>

                  {/* Rate Limiting Info */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Rate Limit Usage</span>
                      <span className="text-sm text-muted-foreground">
                        {usageStats.rate_limiting.current_usage} / {usageStats.rate_limiting.requests_per_minute} per minute
                      </span>
                    </div>
                    <Progress 
                      value={(usageStats.rate_limiting.current_usage / usageStats.rate_limiting.requests_per_minute) * 100} 
                      className="h-2"
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Button onClick={loadUsageStats} disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Load Usage Statistics'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rate Limiting Tab */}
        <TabsContent value="rate-limit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rate Limiting Test</CardTitle>
              <CardDescription>
                Test rate limiting by sending multiple requests quickly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {!apiKey ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Please configure your API key to test rate limiting.
                  </AlertDescription>
                </Alert>
              ) : (
                <>
                  <Button onClick={testRateLimit} disabled={isLoading}>
                    <Zap className="w-4 h-4 mr-2" />
                    {isLoading ? 'Testing...' : 'Test Rate Limiting (15 requests)'}
                  </Button>

                  {rateLimitTest && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold">{rateLimitTest.results.length}</div>
                          <div className="text-sm text-muted-foreground">Total Requests</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-green-600">
                            {rateLimitTest.results.filter((r) => r.success).length}
                          </div>
                          <div className="text-sm text-muted-foreground">Successful</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-red-600">
                            {rateLimitTest.rateLimitAt || 'None'}
                          </div>
                          <div className="text-sm text-muted-foreground">Rate Limited At</div>
                        </div>
                      </div>

                      <div className="space-y-1 max-h-60 overflow-y-auto">
                            {rateLimitTest.results.map((result, index: number) => (
                          <div key={index} className="flex items-center justify-between p-2 text-sm border rounded">
                            <div className="flex items-center gap-2">
                              {result.success ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500" />
                              )}
                              Request #{result.request}
                            </div>
                            <div className="flex items-center gap-2">
                              <span>{result.responseTime}ms</span>
                              <Badge variant={result.success ? "default" : "destructive"}>
                                {result.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}