/**
 * ComprehensiveDocs Component
 * Complete API documentation within the dashboard
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Book, 
  Code, 
  Zap, 
  Shield, 
  Globe, 
  Key,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Menu,
  X,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  id: string;
  title: string;
  icon?: React.ComponentType<{ className?: string }>;
  children?: NavItem[];
}

const navigationItems: NavItem[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Zap,
    children: [
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'authentication', title: 'Authentication' },
      { id: 'first-request', title: 'First Request' }
    ]
  },
  {
    id: 'api-reference',
    title: 'API Reference',
    icon: Code,
    children: [
      { id: 'endpoints', title: 'Endpoints' },
      { id: 'route-optimization', title: 'Route Optimization' },
      { id: 'user-management', title: 'User Management' },
      { id: 'usage-billing', title: 'Usage & Billing' }
    ]
  },
  {
    id: 'integration-guides',
    title: 'Integration Guides',
    icon: Book,
    children: [
      { id: 'javascript', title: 'JavaScript/Node.js' },
      { id: 'python', title: 'Python' },
      { id: 'react-native', title: 'React Native' },
      { id: 'curl', title: 'cURL Examples' }
    ]
  },
  {
    id: 'testing',
    title: 'Testing',
    icon: Shield,
    children: [
      { id: 'unit-testing', title: 'Unit Testing' },
      { id: 'integration-testing', title: 'Integration Testing' }
    ]
  },
  {
    id: 'advanced',
    title: 'Advanced Topics',
    icon: Globe,
    children: [
      { id: 'rate-limiting', title: 'Rate Limiting' },
      { id: 'error-handling', title: 'Error Handling' },
      { id: 'webhooks', title: 'Webhooks' },
      { id: 'sdks', title: 'SDKs & Libraries' }
    ]
  }
];

export function ComprehensiveDocs() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('.docs-section');
      const scrollPosition = window.scrollY + 100;

      sections.forEach((section) => {
        const element = section as HTMLElement;
        const top = element.offsetTop;
        const bottom = top + element.offsetHeight;

        if (scrollPosition >= top && scrollPosition < bottom) {
          setActiveSection(element.id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedCode(id);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setSidebarOpen(false);
    }
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const isActive = activeSection === item.id || 
      (item.children && item.children.some(child => activeSection === child.id));
    
    return (
      <div key={item.id}>
        <button
          onClick={() => scrollToSection(item.id)}
          className={cn(
            "w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors text-left",
            level === 0 ? "font-medium" : "font-normal",
            level > 0 && "ml-4",
            isActive 
              ? "bg-primary/10 text-primary border-r-2 border-primary" 
              : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
          )}
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          <span>{item.title}</span>
          {item.children && <ChevronRight className="h-3 w-3 ml-auto" />}
        </button>
        
        {item.children && (
          <div className="mt-1 space-y-1">
            {item.children.map(child => renderNavItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const CodeBlock = ({ code, language = 'bash', id }: { code: string; language?: string; id: string }) => (
    <div className="relative group">
      <pre className="bg-muted/50 border rounded-lg p-4 text-sm overflow-x-auto">
        <code className={`language-${language}`}>{code}</code>
      </pre>
      <Button
        size="sm"
        variant="ghost"
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={() => copyToClipboard(code, id)}
      >
        {copiedCode === id ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <Copy className="h-4 w-4" />
        )}
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">API Documentation</h2>
        <p className="text-muted-foreground">
          Complete guide to integrating SwiftRoute API into your applications
        </p>
      </div>

      {/* Mobile Header */}
      <div className="lg:hidden sticky top-0 z-50 bg-background/95 backdrop-blur border-b px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="font-semibold">API Documentation</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className={cn(
          "docs-sidebar w-80 bg-card border-r transition-transform duration-300 ease-in-out",
          "lg:translate-x-0 lg:sticky lg:top-0 lg:h-screen lg:block",
          sidebarOpen ? "translate-x-0" : "-translate-x-full",
          "fixed inset-y-0 left-0 z-40 lg:z-0"
        )}>
          <div className="p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <Code className="h-4 w-4 text-primary-foreground" />
              </div>
              <div>
                <h2 className="font-semibold">SwiftRoute API</h2>
                <p className="text-xs text-muted-foreground">v2.0 Documentation</p>
              </div>
            </div>
            
            <ScrollArea className="h-[calc(100vh-8rem)]">
              <nav className="space-y-2">
                {navigationItems.map(item => renderNavItem(item))}
              </nav>
            </ScrollArea>
          </div>
        </aside>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Main Content */}
        <main className="flex-1 container-responsive py-8 lg:py-12 max-w-4xl">
          {/* Getting Started */}
          <section id="getting-started" className="docs-section mb-16">
            <div className="mb-8">
              <h1 className="heading-responsive font-bold mb-4">SwiftRoute API Documentation</h1>
              <p className="text-lg text-muted-foreground mb-6">
                Complete guide to integrating AI-powered route optimization into your applications.
                Get started in minutes with our RESTful API.
              </p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">v2.0</Badge>
                <Badge variant="outline">REST API</Badge>
                <Badge variant="outline">AI Powered</Badge>
                <Badge variant="outline">Global Coverage</Badge>
              </div>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <Zap className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Quick Start</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Get your first route optimization working in under 5 minutes
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <Shield className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Secure & Reliable</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Enterprise-grade security with 99.9% uptime SLA
                  </p>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <Globe className="h-8 w-8 text-primary mb-2" />
                  <CardTitle className="text-lg">Global Coverage</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Works anywhere in the world with consistent quality
                  </p>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Quick Start */}
          <section id="quick-start" className="docs-section mb-16">
            <h2 className="text-2xl font-bold mb-6">Quick Start</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">1. Get Your API Key</h3>
                <p className="text-muted-foreground mb-4">
                  Sign up for a free account and generate your API key from the dashboard.
                </p>
                <Alert className="ml-11">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Keep your API key secret. Never commit it to version control or expose it in client-side code.
                  </AlertDescription>
                </Alert>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">2. Make Your First Request</h3>
                <p className="text-muted-foreground mb-4">
                  Use cURL or your preferred HTTP client to optimize your first route:
                </p>
                <CodeBlock
                  id="first-request"
                  code={`curl -X POST https://swift-route-liard.vercel.app/api/v1/optimize-route \\
  -H "Content-Type: application/json" \\
  -H "X-API-Key: YOUR_API_KEY" \\
  -d '{
    "origin": [-1.2921, 36.8219],
    "destination": [-1.2864, 36.8172],
    "vehicle_type": "car",
    "optimize_for": "time"
  }'`}
                />
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-3">3. Handle the Response</h3>
                <p className="text-muted-foreground mb-4">
                  The API returns optimized routes with performance improvements:
                </p>
                <CodeBlock
                  id="response-example"
                  language="json"
                  code={`{
  "data": {
    "optimized_route": {
      "distance": 4.3,
      "estimated_time": 9.2,
      "cost": 0.65,
      "co2_emissions": 0.51,
      "confidence_score": 0.95
    },
    "improvements": {
      "distance_saved": 0.9,
      "time_saved": 3.3,
      "cost_saved": 0.13,
      "co2_saved": 0.11
    }
  }
}`}
                />
              </div>
            </div>
          </section>

          {/* Authentication */}
          <section id="authentication" className="docs-section mb-16">
            <h2 className="text-2xl font-bold mb-6">Authentication</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    API Key Authentication (Recommended)
                  </CardTitle>
                  <CardDescription>
                    Use API keys for server-to-server communication
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">Header Format</h4>
                    <CodeBlock
                      id="api-key-header"
                      code="X-API-Key: sk_live_your_key_here"
                    />
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">JavaScript Example</h4>
                    <CodeBlock
                      id="js-auth"
                      language="javascript"
                      code={`const headers = {
  'Content-Type': 'application/json',
  'X-API-Key': 'sk_live_your_key_here'
};

const response = await fetch('/api/v1/optimize-route', {
  method: 'POST',
  headers,
  body: JSON.stringify(routeData)
});`}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>JWT Bearer Token</CardTitle>
                  <CardDescription>
                    For dashboard users and web applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    id="jwt-auth"
                    code="Authorization: Bearer your_jwt_token"
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Route Optimization */}
          <section id="route-optimization" className="docs-section mb-16">
            <h2 className="text-2xl font-bold mb-6">Route Optimization</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>POST /optimize-route</CardTitle>
                  <CardDescription>
                    Optimize routes with AI-powered analysis and vehicle-specific algorithms
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-3">Request Parameters</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left py-2 font-medium">Parameter</th>
                            <th className="text-left py-2 font-medium">Type</th>
                            <th className="text-left py-2 font-medium">Required</th>
                            <th className="text-left py-2 font-medium">Description</th>
                          </tr>
                        </thead>
                        <tbody className="text-muted-foreground">
                          <tr className="border-b">
                            <td className="py-2 font-mono">origin</td>
                            <td className="py-2">[lat, lng]</td>
                            <td className="py-2">✅</td>
                            <td className="py-2">Starting coordinates</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono">destination</td>
                            <td className="py-2">[lat, lng]</td>
                            <td className="py-2">✅</td>
                            <td className="py-2">Ending coordinates</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono">vehicle_type</td>
                            <td className="py-2">string</td>
                            <td className="py-2">✅</td>
                            <td className="py-2">car, truck, van, motorcycle, electric_car</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono">optimize_for</td>
                            <td className="py-2">string</td>
                            <td className="py-2">❌</td>
                            <td className="py-2">time, distance, cost, emissions (default: time)</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono">waypoints</td>
                            <td className="py-2">[[lat, lng]]</td>
                            <td className="py-2">❌</td>
                            <td className="py-2">Intermediate stops (max 10)</td>
                          </tr>
                          <tr className="border-b">
                            <td className="py-2 font-mono">avoid_tolls</td>
                            <td className="py-2">boolean</td>
                            <td className="py-2">❌</td>
                            <td className="py-2">Avoid toll roads (default: false)</td>
                          </tr>
                          <tr>
                            <td className="py-2 font-mono">alternatives</td>
                            <td className="py-2">number</td>
                            <td className="py-2">❌</td>
                            <td className="py-2">Number of alternative routes (0-3, default: 2)</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-3">Vehicle-Specific Examples</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h5 className="text-sm font-medium mb-2">🚛 Truck Route</h5>
                        <CodeBlock
                          id="truck-example"
                          language="json"
                          code={`{
  "origin": [-1.2921, 36.8219],
  "destination": [-1.2864, 36.8172],
  "vehicle_type": "truck",
  "optimize_for": "distance",
  "avoid_tolls": true,
  "waypoints": [[-1.2900, 36.8200]]
}`}
                        />
                      </div>
                      
                      <div>
                        <h5 className="text-sm font-medium mb-2">⚡ Electric Vehicle</h5>
                        <CodeBlock
                          id="ev-example"
                          language="json"
                          code={`{
  "origin": [-1.2921, 36.8219],
  "destination": [-1.2864, 36.8172],
  "vehicle_type": "electric_car",
  "optimize_for": "emissions",
  "alternatives": 2
}`}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* JavaScript Integration */}
          <section id="javascript" className="docs-section mb-16">
            <h2 className="text-2xl font-bold mb-6">JavaScript/Node.js Integration</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SwiftRoute Client Class</CardTitle>
                  <CardDescription>
                    Reusable client for Node.js and browser applications
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    id="js-client"
                    language="javascript"
                    code={`class SwiftRouteClient {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl = 'https://swift-route-liard.vercel.app/api/v1';
  }

  async optimizeRoute(params) {
    const response = await fetch(\`\${this.baseUrl}/optimize-route\`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(\`API Error: \${response.status}\`);
    }

    return response.json();
  }
}

// Usage
const client = new SwiftRouteClient('sk_live_your_key');
const result = await client.optimizeRoute({
  origin: [-1.2921, 36.8219],
  destination: [-1.2864, 36.8172],
  vehicle_type: 'car',
  optimize_for: 'time'
});`}
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Error Handling */}
          <section id="error-handling" className="docs-section mb-16">
            <h2 className="text-2xl font-bold mb-6">Error Handling</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>HTTP Status Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Code</th>
                          <th className="text-left py-2 font-medium">Status</th>
                          <th className="text-left py-2 font-medium">Description</th>
                          <th className="text-left py-2 font-medium">Solution</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b">
                          <td className="py-2 font-mono">200</td>
                          <td className="py-2 text-green-600">OK</td>
                          <td className="py-2">Request successful</td>
                          <td className="py-2">-</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-mono">400</td>
                          <td className="py-2 text-orange-600">Bad Request</td>
                          <td className="py-2">Invalid request format</td>
                          <td className="py-2">Check JSON syntax and required fields</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-mono">401</td>
                          <td className="py-2 text-red-600">Unauthorized</td>
                          <td className="py-2">Invalid or missing API key</td>
                          <td className="py-2">Verify API key in headers</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-mono">429</td>
                          <td className="py-2 text-orange-600">Too Many Requests</td>
                          <td className="py-2">Rate limit exceeded</td>
                          <td className="py-2">Implement exponential backoff</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-mono">500</td>
                          <td className="py-2 text-red-600">Internal Server Error</td>
                          <td className="py-2">Server-side error</td>
                          <td className="py-2">Retry with request ID for support</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Retry Logic Example</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    id="retry-logic"
                    language="javascript"
                    code={`async function optimizeRouteWithRetry(params, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await swiftRouteClient.optimizeRoute(params);
    } catch (error) {
      if (error.status === 429) {
        // Rate limit - exponential backoff
        const delay = Math.pow(2, attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      if (error.status >= 500 && attempt < maxRetries) {
        // Server error - retry
        await new Promise(resolve => setTimeout(resolve, 1000));
        continue;
      }
      
      throw error; // Don't retry client errors
    }
  }
}`}
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Rate Limiting */}
          <section id="rate-limiting" className="docs-section mb-16">
            <h2 className="text-2xl font-bold mb-6">Rate Limiting</h2>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Tier-Based Limits</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-2 font-medium">Tier</th>
                          <th className="text-left py-2 font-medium">Requests/Minute</th>
                          <th className="text-left py-2 font-medium">Requests/Month</th>
                          <th className="text-left py-2 font-medium">Burst Limit</th>
                        </tr>
                      </thead>
                      <tbody className="text-muted-foreground">
                        <tr className="border-b">
                          <td className="py-2 font-medium">Trial</td>
                          <td className="py-2">5</td>
                          <td className="py-2">100</td>
                          <td className="py-2">10</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Starter</td>
                          <td className="py-2">10</td>
                          <td className="py-2">1,000</td>
                          <td className="py-2">25</td>
                        </tr>
                        <tr className="border-b">
                          <td className="py-2 font-medium">Professional</td>
                          <td className="py-2">50</td>
                          <td className="py-2">10,000</td>
                          <td className="py-2">100</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-medium">Enterprise</td>
                          <td className="py-2">200</td>
                          <td className="py-2">100,000</td>
                          <td className="py-2">500</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Rate Limit Headers</CardTitle>
                </CardHeader>
                <CardContent>
                  <CodeBlock
                    id="rate-limit-headers"
                    code={`X-RateLimit-Limit: 50
X-RateLimit-Remaining: 47
X-RateLimit-Reset: 1732026777
X-RateLimit-Retry-After: 60`}
                  />
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Footer */}
          <footer className="mt-16 pt-8 border-t">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-sm text-muted-foreground">
                © 2025 SwiftRoute. All rights reserved.
              </div>
              <div className="flex gap-4">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  Postman Collection
                </Button>
                <Button variant="ghost" size="sm" className="gap-2">
                  <ExternalLink className="h-4 w-4" />
                  OpenAPI Spec
                </Button>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
