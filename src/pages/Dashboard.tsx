import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Navigation, MapPin, Route, Users, BarChart3, LogOut } from 'lucide-react';

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
            Your intelligent routing dashboard
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Route className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Route Planning</CardTitle>
              <CardDescription>
                Create optimized routes using advanced algorithms
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full">Plan Route</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <MapPin className="h-8 w-8 text-accent mb-2" />
              <CardTitle>Saved Routes</CardTitle>
              <CardDescription>
                Access and manage your saved routes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Routes</Button>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Analytics</CardTitle>
              <CardDescription>
                View routing performance and statistics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full">View Stats</Button>
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card>
          <CardHeader>
            <CardTitle>About SwiftRoute</CardTitle>
            <CardDescription>
              Advanced routing system with real-time optimization
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Users className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Multi-Algorithm Support</h3>
                <p className="text-sm text-muted-foreground">
                  Choose from Dijkstra, A*, or advanced GNN-based routing
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-accent mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Real-Time Traffic</h3>
                <p className="text-sm text-muted-foreground">
                  Routes adapt to current traffic conditions
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <BarChart3 className="h-5 w-5 text-primary mt-0.5" />
              <div>
                <h3 className="font-semibold mb-1">Performance Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  Track and optimize your routing efficiency
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Dashboard;
