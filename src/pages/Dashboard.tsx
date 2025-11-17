import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Key, BarChart3, LogOut, CreditCard, User, MapPin, Code, Users } from 'lucide-react';
import { APIKeyManagement } from '@/components/APIKeyManagement';
import { UsageAnalytics } from '@/components/UsageAnalytics';
import { BillingDashboard } from '@/components/BillingDashboard';
import { ProfileManagement } from '@/components/ProfileManagement';
import { RouteOptimizer } from '@/components/RouteOptimizer';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Logo } from '@/components/Logo';

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
          <Navigation className="h-12 w-12 text-primary animate-pulse mx-auto" />
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

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="route-optimizer">Route Optimizer</TabsTrigger>
            <TabsTrigger value="api-keys">API Keys</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Feature Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                const tab = document.querySelector('[value="api-keys"]') as HTMLElement;
                tab?.click();
              }}>
                <CardHeader>
                  <Key className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>API Keys</CardTitle>
                  <CardDescription>
                    Generate and manage your API keys
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    const tab = document.querySelector('[value="api-keys"]') as HTMLElement;
                    tab?.click();
                  }}>
                    Manage API Keys
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                const tab = document.querySelector('[value="route-optimizer"]') as HTMLElement;
                tab?.click();
              }}>
                <CardHeader>
                  <MapPin className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Route Optimization</CardTitle>
                  <CardDescription>
                    Test route optimization with GNN algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    const tab = document.querySelector('[value="route-optimizer"]') as HTMLElement;
                    tab?.click();
                  }}>
                    Try Route Optimizer
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                const tab = document.querySelector('[value="analytics"]') as HTMLElement;
                tab?.click();
              }}>
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-accent mb-2" />
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>
                    View API usage statistics and billing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    const tab = document.querySelector('[value="analytics"]') as HTMLElement;
                    tab?.click();
                  }}>
                    View Analytics
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => {
                const tab = document.querySelector('[value="billing"]') as HTMLElement;
                tab?.click();
              }}>
                <CardHeader>
                  <CreditCard className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Billing</CardTitle>
                  <CardDescription>
                    Manage subscription and payments
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={(e) => {
                    e.stopPropagation();
                    const tab = document.querySelector('[value="billing"]') as HTMLElement;
                    tab?.click();
                  }}>
                    View Billing
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Info Section */}
            <Card>
              <CardHeader>
                <CardTitle>SwiftRoute B2B API Platform</CardTitle>
                <CardDescription>
                  Advanced route optimization API powered by Graph Neural Networks
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Code className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">RESTful API</h3>
                    <p className="text-sm text-muted-foreground">
                      Easy integration with comprehensive authentication and rate limiting
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">Multi-Tier Billing</h3>
                    <p className="text-sm text-muted-foreground">
                      Starter, Professional, and Enterprise tiers with pay-as-you-go pricing
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-semibold mb-1">GNN-Enhanced Optimization</h3>
                    <p className="text-sm text-muted-foreground">
                      Superior route optimization using Graph Neural Networks
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api-keys">
            <APIKeyManagement />
          </TabsContent>

          <TabsContent value="analytics">
            <UsageAnalytics />
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

          <TabsContent value="route-planning" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Route Planning Interface</CardTitle>
                <CardDescription>
                  Interactive route planning and optimization (Coming Soon)
                </CardDescription>
              </CardHeader>
              <CardContent className="text-center py-12">
                <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">Route Planning Coming Soon</h3>
                <p className="text-muted-foreground mb-4">
                  Interactive map interface with route optimization will be available in the next update.
                </p>
                <p className="text-sm text-muted-foreground">
                  For now, use the API Management tab to test the route optimization API endpoints.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Dashboard;
