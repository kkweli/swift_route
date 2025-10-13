import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Map, Zap, Shield, Code, Video, Users } from "lucide-react";
import { Link } from "react-router-dom";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SwiftRoute</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/auth">Sign In</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Intelligent Routing & Navigation for Enterprise
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Powered by AI and advanced graph algorithms. Optimize your logistics with real-time traffic data and multiple routing algorithms.
        </p>
        <div className="flex gap-4 justify-center">
          <Button size="lg" asChild>
            <Link to="/auth">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline">
            Schedule Demo
          </Button>
        </div>
      </section>

      {/* Product Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Product Features</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Real-Time Optimization</CardTitle>
              <CardDescription>
                AI-powered route optimization that adapts to live traffic conditions and road incidents
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Map className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Advanced Algorithms</CardTitle>
              <CardDescription>
                Multiple routing algorithms including Dijkstra, A*, and custom heuristics for optimal path finding
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Enterprise Security</CardTitle>
              <CardDescription>
                Bank-level security with role-based access control and comprehensive audit logging
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Services */}
      <section className="bg-secondary/20 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Services</h2>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Code className="h-8 w-8 text-primary mb-2" />
                <CardTitle>API Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  RESTful API with comprehensive documentation. Generate API keys instantly and integrate routing into your existing systems.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Rate limiting and usage analytics</li>
                  <li>Webhook support for real-time updates</li>
                  <li>SDKs for popular languages</li>
                </ul>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Users className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Developer Sandbox</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Test and develop with our free developer sandbox. No credit card required for evaluation.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>1000 API calls per month free</li>
                  <li>Full feature access</li>
                  <li>Interactive API documentation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Examples */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">Implementation Examples</h2>
        <div className="grid md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <Video className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Logistics Fleet Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <Video className="h-16 w-16 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                See how a Fortune 500 logistics company reduced delivery times by 23% using SwiftRoute's AI optimization.
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Video className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Ride-Sharing Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-muted rounded-lg flex items-center justify-center mb-4">
                <Video className="h-16 w-16 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">
                Learn how ride-sharing platforms integrate our API for real-time driver-passenger matching and routing.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Transform Your Routing?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join leading enterprises using SwiftRoute for intelligent navigation
          </p>
          <Button size="lg" variant="secondary" asChild>
            <Link to="/auth">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2025 SwiftRoute. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
