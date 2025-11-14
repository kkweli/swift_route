import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Navigation, MapPin, Route, Users, BarChart3, LogOut, Settings, Code } from 'lucide-react';
import { APIManagement } from '@/components/APIManagement';

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
          <div className="flex items-center gap-2">
            <Navigation className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">SwiftRoute</h1>
          </div>
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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="api-management">API Management</TabsTrigger>
            <TabsTrigger value="route-planning">Route Planning</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Feature Cards */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Code className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>API Management</CardTitle>
                  <CardDescription>
                    Test and manage your SwiftRoute API integration
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button className="w-full" onClick={() => document.querySelector('[value="api-management"]')?.click()}>
                    Manage API
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Route className="h-8 w-8 text-primary mb-2" />
                  <CardTitle>Route Optimization</CardTitle>
                  <CardDescription>
                    Test route optimization with GNN algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" disabled>
                    Coming Soon
                  </Button>
                </CardContent>
              </Card>

              <Card className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <BarChart3 className="h-8 w-8 text-accent mb-2" />
                  <CardTitle>Usage Analytics</CardTitle>
                  <CardDescription>
                    View API usage statistics and billing
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button variant="outline" className="w-full" onClick={() => document.querySelector('[value="api-management"]')?.click()}>
                    View Analytics
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

          <TabsContent value="api-management">
            <APIManagement />
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
                <Route className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
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
