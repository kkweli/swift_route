import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Map, Brain, TrendingDown, Leaf, Target, Building2, Zap, Code, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Map className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">SwiftRoute</span>
          </div>
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/pricing">Pricing</Link>
            </Button>
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
      <section className="container mx-auto px-4 py-20 text-center max-w-5xl">
        <div className="flex justify-center gap-2 mb-6">
          <Badge variant="secondary" className="text-sm">
            <Building2 className="h-3 w-3 mr-1" />
            UN SDG 11 Aligned
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Brain className="h-3 w-3 mr-1" />
            GNN-Powered AI
          </Badge>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          AI-Powered Logistics Optimizer for Sustainable Cities
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
          SwiftRoute transforms logistics with Graph Neural Network technology. Cut operational costs by 20%+, reduce CO₂ emissions, and deliver reliable ETAs—even in data-scarce environments.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" asChild>
            <Link to="/auth">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link to="/pricing">View Pricing</Link>
          </Button>
        </div>
      </section>

      {/* Key Metrics */}
      <section className="container mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-4 gap-6 max-w-5xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-6">
              <TrendingDown className="h-10 w-10 text-green-600 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-2 text-primary">20-30%</div>
              <p className="text-sm text-muted-foreground">Reduction in Fuel Costs</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Leaf className="h-10 w-10 text-green-600 mx-auto mb-3" />
              <div className="text-4xl font-bold mb-2 text-primary">25%+</div>
              <p className="text-sm text-muted-foreground">Lower CO₂ Emissions</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <Target className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-4xl font-bold mb-2 text-primary">99.9%</div>
              <p className="text-sm text-muted-foreground">API Uptime SLA</p>
            </CardContent>
          </Card>
          <Card className="text-center">
            <CardContent className="pt-6">
              <BarChart3 className="h-10 w-10 text-primary mx-auto mb-3" />
              <div className="text-4xl font-bold mb-2 text-primary">Real-Time</div>
              <p className="text-sm text-muted-foreground">Traffic Optimization</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* SDG 11 Alignment */}
      <section className="bg-secondary/20 py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Built for UN SDG 11: Sustainable Cities</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              SwiftRoute directly addresses two critical UN Sustainable Development Goal targets with quantifiable impact
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-xl">Target 11.2: Sustainable Transport</CardTitle>
                <CardDescription>
                  Affordable, accessible, and reliable transport systems
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>15-30% reduction</strong> in operational costs through optimized routing
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Accurate ETAs</strong> even in data-scarce regions using GNN technology
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Enhanced accessibility</strong> by removing transit uncertainty
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Leaf className="h-10 w-10 text-green-600 mb-3" />
                <CardTitle className="text-xl">Target 11.6: Environmental Impact</CardTitle>
                <CardDescription>
                  Reduce adverse environmental impact and improve air quality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Verified CO₂ reduction</strong> reports showing X kg saved per 100 deliveries
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>20%+ reduction</strong> in fleet mileage and fuel consumption
                  </p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-green-600 mt-2 flex-shrink-0" />
                  <p className="text-sm">
                    <strong>Lower PM2.5 & PM10</strong> emissions contributing to cleaner urban air
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* B2B Features */}
      <section className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Enterprise-Grade B2B API Platform</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Industry-agnostic solution for any dispatch or route planning operation
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 text-primary mb-2" />
              <CardTitle>GNN Technology</CardTitle>
              <CardDescription>
                Self-learning Graph Neural Networks handle complex, non-linear relationships in logistics networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Functions with limited infrastructure data</li>
                <li>• Adapts to dynamic traffic patterns</li>
                <li>• Superior to traditional GPS systems</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-primary mb-2" />
              <CardTitle>RESTful API</CardTitle>
              <CardDescription>
                Easy integration with comprehensive authentication and rate limiting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Instant API key generation</li>
                <li>• Detailed usage analytics</li>
                <li>• SDKs for major languages</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Real-Time Data</CardTitle>
              <CardDescription>
                Live traffic, weather patterns, and historical congestion for predictive optimization
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="text-sm text-muted-foreground space-y-2">
                <li>• Multi-objective optimization</li>
                <li>• Time windows & capacity constraints</li>
                <li>• Priority-based routing</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Pricing Tiers */}
      <section className="bg-secondary/20 py-20">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Flexible Pricing for Every Scale</h2>
            <p className="text-muted-foreground">
              Pay-as-you-go pricing with tiered rate limits
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Starter</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 1,000 requests/month</li>
                  <li>• 10 requests/minute</li>
                  <li>• $0.01 per additional request</li>
                  <li>• Email support</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-primary shadow-lg">
              <CardHeader>
                <Badge className="w-fit mb-2">Most Popular</Badge>
                <CardTitle>Professional</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$199</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 10,000 requests/month</li>
                  <li>• 50 requests/minute</li>
                  <li>• $0.008 per additional request</li>
                  <li>• Priority support</li>
                  <li>• Advanced analytics</li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="mt-4">
                  <span className="text-4xl font-bold">$999</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>• 100,000 requests/month</li>
                  <li>• 200 requests/minute</li>
                  <li>• $0.005 per additional request</li>
                  <li>• 24/7 support</li>
                  <li>• Custom integrations</li>
                  <li>• SLA guarantee</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button size="lg" asChild>
              <Link to="/pricing">
                View Full Pricing Details <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-4xl font-bold mb-4">Transform Your Logistics Operations</h2>
          <p className="text-xl mb-8 opacity-90">
            Join forward-thinking enterprises building sustainable, efficient logistics with SwiftRoute's B2B API
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">
                Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary">
              Schedule Demo
            </Button>
          </div>
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
