import { useAuth } from '@/hooks/useAuth';
import { useNavigate, Link } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, BarChart3, LogOut, CreditCard, User, MapPin, Code, Users, ArrowRight, Zap, RefreshCw } from 'lucide-react';
import { APIKeyManagement } from '@/components/APIKeyManagement';
import { BillingDashboard } from '@/components/BillingDashboard';
import { ProfileManagement } from '@/components/ProfileManagement';
import { RouteOptimizer } from '@/components/RouteOptimizer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Logo } from '@/components/Logo';
import { SubscriptionMetrics } from '@/components/SubscriptionMetrics';
import { UsageStatistics } from '@/components/UsageStatistics';
import { APIKeysSummary } from '@/components/APIKeysSummary';
import { RecentActivity } from '@/components/RecentActivity';
import { useAnalyticsState } from '@/hooks/useAnalytics';

const AnalyticsTab = () => {
  const { data, errors, refetch, isLoading } = useAnalyticsState();
  const navigate = useNavigate();

  const handleManageKeys = () => {
    // This will be handled by parent Dashboard component
    const tabsList = document.querySelector('[value="api-keys"]') as HTMLElement;
    if (tabsList) {
      tabsList.click();
    }
  };

  const handleRefresh = () => {
    refetch.subscription();
    refetch.usage();
    refetch.apiKeys();
  };

  return (
    <div className="space-y-6">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Analytics Dashboard</h3>
          <p className="text-muted-foreground">Monitor your API usage and subscription</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleRefresh} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Top Row: Subscription and Usage */}
      <div className="grid gap-6 md:grid-cols-2">
        <SubscriptionMetrics
          subscription={data.subscription}
          isLoading={isLoading}
          error={errors.subscription}
          onRetry={refetch.subscription}
        />
        <UsageStatistics
          usage={data.usage}
          isLoading={isLoading}
          error={errors.usage}
          onRetry={refetch.usage}
        />
      </div>

      {/* Bottom Row: API Keys and Recent Activity */}
      <div className="grid gap-6 md:grid-cols-2">
        <APIKeysSummary
          apiKeys={data.apiKeys}
          isLoading={isLoading}
          error={errors.apiKeys}
          onManageKeys={handleManageKeys}
          onRetry={refetch.apiKeys}
        />
        <RecentActivity
          logs={data.usage?.recent_logs || []}
          isLoading={isLoading}
          error={errors.usage}
          onRetry={refetch.usage}
        />
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Logo size="lg" className="animate-pulse mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/5">
      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Logo size="md" />
          <Button variant="ghost" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Welcome back!</h2>
          <p className="text-muted-foreground">
            Your SwiftRoute B2B API platform dashboard
          </p>
        </div>

        <Tabs defaultValue="analytics" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="route-optimizer">Route Optimizer</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="docs">Docs</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsTab />
          </TabsContent>

          <TabsContent value="api-keys">
            <APIKeyManagement />
          </TabsContent>

          <TabsContent value="billing">
            <BillingDashboard />
          </TabsContent>

          <TabsContent value="profile">
            <ProfileManagement />
          </TabsContent>

          <TabsContent value="route-optimizer" className="space-y-6">
            <ErrorBoundary>
              <RouteOptimizer />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="docs" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>API Documentation</CardTitle>
                <CardDescription>
                  Complete guide to integrating SwiftRoute API
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Quick Links */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-2">
                    <CardHeader>
                      <Code className="h-8 w-8 text-primary mb-2" />
                      <CardTitle className="text-lg">API Reference</CardTitle>
                      <CardDescription>
                        Complete API endpoints, parameters, and responses
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link 
                        to="/docs"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        View Full Documentation
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>

                  <Card className="border-2">
                    <CardHeader>
                      <Zap className="h-8 w-8 text-primary mb-2" />
                      <CardTitle className="text-lg">Quick Start</CardTitle>
                      <CardDescription>
                        Get started in minutes with code examples
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Link 
                        to="/docs"
                        className="text-primary hover:underline flex items-center gap-2"
                      >
                        View Quick Start Guide
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </CardContent>
                  </Card>
                </div>

                {/* Quick Example */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Quick Example</h3>
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                    <pre className="text-sm">
{`curl -X POST https://swift-route-liard.vercel.app/api/v1/optimize-route \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "origin": [-1.2921, 36.8219],
    "destination": [-1.2864, 36.8172],
    "vehicle_type": "car",
    "optimize_for": "time"
  }'`}
                    </pre>
                  </div>
                </div>

                {/* Key Features */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Key Features</h3>
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">Global Coverage</p>
                        <p className="text-sm text-muted-foreground">Works anywhere in the world</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">Multiple Vehicle Types</p>
                        <p className="text-sm text-muted-foreground">Car, truck, van, motorcycle, bicycle</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">Alternative Routes</p>
                        <p className="text-sm text-muted-foreground">Get multiple route options</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                      <div>
                        <p className="font-medium">Real-time Optimization</p>
                        <p className="text-sm text-muted-foreground">Sub-second response times</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
