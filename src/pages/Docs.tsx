import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Code, Zap, ArrowRight, Book, Globe, Shield, BarChart3, Key } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from '@/components/Logo';

export default function Docs() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Logo size="md" />
          <div className="flex gap-4">
            <Button variant="ghost" asChild>
              <Link to="/">Home</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link to="/pricing">Pricing</Link>
            </Button>
            <Button asChild>
              <Link to="/auth">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-20 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">SwiftRoute Documentation</h1>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Everything you need to integrate intelligent route optimization into your applications
          </p>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Get Started in Minutes</h2>
              <p className="text-lg text-muted-foreground mb-6">
                SwiftRoute's RESTful API makes integration simple. Get your first route optimization 
                working in under 5 minutes.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">1</div>
                  <span>Sign up for free account</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">2</div>
                  <span>Generate your API key</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">3</div>
                  <span>Make your first API call</span>
                </div>
              </div>
              <div className="mt-8">
                <Button asChild>
                  <Link to="/auth">Start Free Trial</Link>
                </Button>
              </div>
            </div>
            <div className="bg-gray-900 text-gray-100 p-6 rounded-lg overflow-x-auto">
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
        </div>
      </section>

      {/* Documentation Sections */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Documentation</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* API Reference */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Code className="h-8 w-8 text-primary mb-2" />
                <CardTitle>API Reference</CardTitle>
                <CardDescription>
                  Complete API endpoints, parameters, and response formats
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li>• Route optimization endpoint</li>
                  <li>• Authentication methods</li>
                  <li>• Error handling</li>
                  <li>• Rate limits</li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard">View in Dashboard</Link>
                </Button>
              </CardContent>
            </Card>

            {/* Quick Start */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Zap className="h-8 w-8 text-primary mb-2" />
                <CardTitle>Quick Start Guide</CardTitle>
                <CardDescription>
                  Step-by-step integration guide with code examples
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li>• Account setup</li>
                  <li>• API key generation</li>
                  <li>• First API call</li>
                  <li>• Code examples</li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard">Get Started</Link>
                </Button>
              </CardContent>
            </Card>

            {/* SDKs & Libraries */}
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <Book className="h-8 w-8 text-primary mb-2" />
                <CardTitle>SDKs & Libraries</CardTitle>
                <CardDescription>
                  Official and community SDKs for popular languages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm text-muted-foreground mb-4">
                  <li>• JavaScript/Node.js</li>
                  <li>• Python</li>
                  <li>• PHP</li>
                  <li>• cURL examples</li>
                </ul>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/dashboard">View SDKs</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Key Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <Globe className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Global Coverage</h3>
              <p className="text-sm text-muted-foreground">
                Works anywhere in the world with consistent quality
              </p>
            </div>
            <div className="text-center">
              <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Fast Performance</h3>
              <p className="text-sm text-muted-foreground">
                Sub-second response times for real-time applications
              </p>
            </div>
            <div className="text-center">
              <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Secure & Reliable</h3>
              <p className="text-sm text-muted-foreground">
                Enterprise-grade security with 99.9% uptime
              </p>
            </div>
            <div className="text-center">
              <BarChart3 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="font-semibold mb-2">Analytics Included</h3>
              <p className="text-sm text-muted-foreground">
                Comprehensive usage tracking and reporting
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Simple, Transparent Pricing</h2>
          <div className="grid md:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Trial</CardTitle>
                <div className="text-3xl font-bold">Free</div>
                <CardDescription>Perfect for testing</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>100 requests/month</li>
                  <li>5 requests/minute</li>
                  <li>Basic support</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="text-center border-primary">
              <CardHeader>
                <Badge className="mb-2">Most Popular</Badge>
                <CardTitle>Starter</CardTitle>
                <div className="text-3xl font-bold">$29<span className="text-sm font-normal">/mo</span></div>
                <CardDescription>For small fleets</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>1,000 requests/month</li>
                  <li>10 requests/minute</li>
                  <li>Email support</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Professional</CardTitle>
                <div className="text-3xl font-bold">$199<span className="text-sm font-normal">/mo</span></div>
                <CardDescription>For growing businesses</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>10,000 requests/month</li>
                  <li>50 requests/minute</li>
                  <li>Priority support</li>
                </ul>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardHeader>
                <CardTitle>Enterprise</CardTitle>
                <div className="text-3xl font-bold">$999<span className="text-sm font-normal">/mo</span></div>
                <CardDescription>For large operations</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li>100,000 requests/month</li>
                  <li>200 requests/minute</li>
                  <li>Dedicated support</li>
                </ul>
              </CardContent>
            </Card>
          </div>
          <div className="text-center mt-8">
            <Button asChild>
              <Link to="/pricing">View Full Pricing</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join companies reducing costs and emissions with SwiftRoute
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/auth">Start Free Trial</Link>
            </Button>
            <Button size="lg" variant="outline" className="border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
              <Link to="/dashboard">View Dashboard</Link>
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
}
