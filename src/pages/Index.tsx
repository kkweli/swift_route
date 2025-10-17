import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Map, Zap, Shield, Code, Leaf, Users, Truck, Package, MapPin, Clock, Target, Brain, TrendingDown, Building2, ShoppingCart, Ambulance, Bus, Trash2, Wrench } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

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
        <div className="flex justify-center gap-2 mb-6">
          <Badge variant="secondary" className="text-sm">
            <Leaf className="h-3 w-3 mr-1" />
            UN SDG 11 & 9 Aligned
          </Badge>
          <Badge variant="secondary" className="text-sm">
            <Brain className="h-3 w-3 mr-1" />
            GNN-Powered
          </Badge>
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          Multi-Use Logistics Route Optimization
        </h1>
        <p className="text-xl text-muted-foreground mb-4 max-w-3xl mx-auto">
          Graph Neural Network-based route optimization API for sustainable cities and resilient infrastructure
        </p>
        <p className="text-base text-muted-foreground mb-8 max-w-2xl mx-auto">
          Industry-agnostic B2B solution minimizing fuel consumption, reducing carbon emissions, and maximizing operational efficiency across any dispatch or route planning operation
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <Button size="lg" asChild>
            <Link to="/auth">
              Start Free Trial <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button size="lg" variant="outline">
            Schedule Demo
          </Button>
          <Button size="lg" variant="outline">
            View API Docs
          </Button>
        </div>
      </section>

      {/* SDG Impact Section */}
      <section className="bg-secondary/20 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Driving Sustainable Development</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our GNN-based optimization aligns with UN Sustainable Development Goals, creating measurable environmental and social impact
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            <Card>
              <CardHeader>
                <Building2 className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-2xl">SDG 11: Sustainable Cities</CardTitle>
                <CardDescription className="text-base">
                  Making cities inclusive, safe, resilient, and sustainable
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Target className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Target 11.2: Sustainable Transport</p>
                    <p className="text-sm text-muted-foreground">
                      Safe, affordable, accessible transport systems through optimized efficiency and reduced operational costs
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Leaf className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Target 11.6: Environmental Impact</p>
                    <p className="text-sm text-muted-foreground">
                      Reduced vehicle mileage means lower fuel consumption, decreased carbon emissions, and improved air quality
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Zap className="h-10 w-10 text-primary mb-3" />
                <CardTitle className="text-2xl">SDG 9: Innovation & Infrastructure</CardTitle>
                <CardDescription className="text-base">
                  Resilient infrastructure and sustainable industrialization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <Brain className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Target 9.1: Resilient Infrastructure</p>
                    <p className="text-sm text-muted-foreground">
                      Advanced GNN technology provides innovative, resilient infrastructure for logistics planning
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <TrendingDown className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-sm">Target 9.4: Resource Efficiency</p>
                    <p className="text-sm text-muted-foreground">
                      Clean, environmentally sound technology adoption with dramatically improved resource utilization
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Technology & Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-12">GNN-Powered Optimization</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Brain className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Graph Neural Networks</CardTitle>
              <CardDescription>
                Advanced AI handling dynamic, non-linear relationships within logistics networks (nodes as stops, edges as routes)
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Clock className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Real-Time Dynamic Data</CardTitle>
              <CardDescription>
                Incorporates live traffic, weather patterns, and historical congestion for predictive route optimization
              </CardDescription>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Complex Constraints</CardTitle>
              <CardDescription>
                Handles time windows, vehicle capacity, driver breaks, and multi-objective optimization seamlessly
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* Solution Scope */}
      <section className="bg-secondary/20 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Multi-Dimensional Solution Scope</h2>
            <p className="text-muted-foreground max-w-3xl mx-auto">
              Industry-agnostic optimization engine adapting to any dispatch or route planning operation across geographic, operational, and technological dimensions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <Card>
              <CardHeader>
                <MapPin className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Geographic Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Optimize routes within any network topology
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Urban last-mile delivery networks</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Regional supply chain logistics</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Intra-facility warehouse operations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Campus autonomous vehicle routing</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Target className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Operational Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Multi-objective optimization with real-world constraints
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Minimize time, distance, or cost objectives</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Time window & capacity constraints</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Driver break compliance & regulations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Priority-based routing for urgent deliveries</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Brain className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Technological Scope</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">
                  Dynamic GNN engine with comprehensive data integration
                </p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Real-time traffic & incident data</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Weather pattern integration</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Historical congestion prediction</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary font-semibold">•</span>
                    <span>Adaptive learning from route performance</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <Code className="h-8 w-8 text-primary mb-2" />
                <CardTitle>B2B API Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  RESTful API with comprehensive documentation. Generate API keys instantly and integrate the optimization engine into your existing dispatch systems.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>Enterprise-grade SLA with 99.9% uptime</li>
                  <li>Rate limiting and detailed usage analytics</li>
                  <li>Webhook support for real-time route updates</li>
                  <li>SDKs for Python, JavaScript, Java, and .NET</li>
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
                  Full-featured sandbox environment for testing and development. No credit card required for evaluation and proof-of-concept projects.
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                  <li>1,000 API calls per month free</li>
                  <li>Access to all optimization algorithms</li>
                  <li>Interactive API documentation and examples</li>
                  <li>Technical support during evaluation</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Industry Applications */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Industry-Agnostic Applications</h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            The same core optimization engine applies to any business with dispatch or route planning needs across multiple sectors
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <ShoppingCart className="h-8 w-8 text-primary mb-2" />
              <CardTitle>E-Commerce & Retail</CardTitle>
              <CardDescription>Last-Mile Delivery Optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
                <img
                  src="https://images.pexels.com/photos/4391470/pexels-photo-4391470.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Delivery person with packages"
                  className="w-full h-full object-cover"
                />
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>23% reduction in delivery times</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>30% decrease in fuel costs</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Real-time ETAs for customers</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Wrench className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Field Services</CardTitle>
              <CardDescription>Technician Scheduling & Routing</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
                <img
                  src="https://images.pexels.com/photos/5691525/pexels-photo-5691525.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Field technician working"
                  className="w-full h-full object-cover"
                />
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>40% more service calls per day</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Emergency priority routing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Skills-based technician matching</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Ambulance className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Emergency Response</CardTitle>
              <CardDescription>Ambulance & Police Dispatch</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-red-50 to-red-100 dark:from-red-950 dark:to-red-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
                <img
                  src="https://images.pexels.com/photos/263402/pexels-photo-263402.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Emergency ambulance"
                  className="w-full h-full object-cover"
                />
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Life-saving response time reduction</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Real-time traffic incident avoidance</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Multi-unit coordination</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Bus className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Public Transit</CardTitle>
              <CardDescription>Dynamic Bus Route Optimization</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
                <img
                  src="https://images.pexels.com/photos/385998/pexels-photo-385998.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Public bus on city street"
                  className="w-full h-full object-cover"
                />
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Demand-responsive routing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>18% improvement in on-time arrivals</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Reduced carbon footprint per passenger</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Trash2 className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Waste Management</CardTitle>
              <CardDescription>Collection Route Planning</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
                <img
                  src="https://images.pexels.com/photos/3181031/pexels-photo-3181031.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Waste collection truck"
                  className="w-full h-full object-cover"
                />
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>35% reduction in collection routes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Fill-level sensor integration</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Significant emission reductions</span>
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <Package className="h-8 w-8 text-primary mb-2" />
              <CardTitle>Supply Chain Logistics</CardTitle>
              <CardDescription>Multi-Depot Distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="aspect-video bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900 rounded-lg flex items-center justify-center mb-4 overflow-hidden relative">
                <img
                  src="https://images.pexels.com/photos/4481259/pexels-photo-4481259.jpeg?auto=compress&cs=tinysrgb&w=800"
                  alt="Warehouse logistics operation"
                  className="w-full h-full object-cover"
                />
              </div>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Cross-docking optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Multi-vehicle fleet coordination</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary">✓</span>
                  <span>Regional network efficiency gains</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Impact Metrics */}
      <section className="bg-secondary/10 py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Measurable Impact</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Real results from GNN-based optimization across diverse implementations
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="text-center">
              <CardContent className="pt-6">
                <TrendingDown className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <div className="text-4xl font-bold mb-2 text-primary">23-35%</div>
                <p className="text-sm text-muted-foreground">Reduction in Total Distance Traveled</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Leaf className="h-10 w-10 text-green-600 mx-auto mb-3" />
                <div className="text-4xl font-bold mb-2 text-primary">30%</div>
                <p className="text-sm text-muted-foreground">Decrease in Carbon Emissions</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Clock className="h-10 w-10 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold mb-2 text-primary">40%</div>
                <p className="text-sm text-muted-foreground">Increase in Daily Service Capacity</p>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="pt-6">
                <Target className="h-10 w-10 text-primary mx-auto mb-3" />
                <div className="text-4xl font-bold mb-2 text-primary">99.9%</div>
                <p className="text-sm text-muted-foreground">API Uptime SLA Guarantee</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-4">Transform Your Operations with GNN Optimization</h2>
          <p className="text-xl mb-8 opacity-90">
            Join forward-thinking enterprises building sustainable, efficient logistics with our B2B API
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
