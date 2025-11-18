/**
 * ComprehensiveDocs Component
 * Complete API documentation within the dashboard
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Code, Zap, Book, Key, AlertCircle, CheckCircle2 } from 'lucide-react';

export function ComprehensiveDocs() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">API Documentation</h2>
        <p className="text-muted-foreground">
          Complete guide to integrating SwiftRoute API into your applications
        </p>
      </div>

      <Tabs defaultValue="quickstart" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
          <TabsTrigger value="api-reference">API Reference</TabsTrigger>
          <TabsTrigger value="examples">Code Examples</TabsTrigger>
          <TabsTrigger value="postman">Postman Testing</TabsTrigger>
          <TabsTrigger value="integration">Integration</TabsTrigger>
        </TabsList>

        {/* Quick Start */}
        <TabsContent value="quickstart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Get Started in 3 Steps
              </CardTitle>
              <CardDescription>
                Start making API requests in under 5 minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Step 1 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    1
                  </div>
                  <h3 className="text-lg font-semibold">Generate Your API Key</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-11">
                  Navigate to the "API Keys" tab and click "Generate New Key". Save your key securely - it won't be shown again.
                </p>
                <Alert className="ml-11">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Keep your API key secret. Never commit it to version control or expose it in client-side code.
                  </AlertDescription>
                </Alert>
              </div>

              {/* Step 2 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    2
                  </div>
                  <h3 className="text-lg font-semibold">Make Your First Request</h3>
                </div>
                <div className="ml-11 bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
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

              {/* Step 3 */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                    3
                  </div>
                  <h3 className="text-lg font-semibold">Parse the Response</h3>
                </div>
                <p className="text-sm text-muted-foreground ml-11">
                  The API returns optimized routes with baseline comparison, showing distance, time, cost, and CO₂ savings.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Reference */}
        <TabsContent value="api-reference" className="space-y-6">
          {/* Base URL */}
          <Card>
            <CardHeader>
              <CardTitle>Base URL</CardTitle>
            </CardHeader>
            <CardContent>
              <code className="bg-muted px-3 py-1 rounded text-sm">
                https://swift-route-liard.vercel.app/api/v1
              </code>
            </CardContent>
          </Card>

          {/* Authentication */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5" />
                Authentication
              </CardTitle>
              <CardDescription>
                All API requests require authentication via API key
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Header Format:</p>
                <code className="bg-muted px-3 py-1 rounded text-sm block">
                  X-API-Key: sk_live_your_api_key_here
                </code>
              </div>
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  Your API key is tied to your subscription tier and rate limits.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>

          {/* Optimize Route Endpoint */}
          <Card>
            <CardHeader>
              <CardTitle>POST /optimize-route</CardTitle>
              <CardDescription>
                Optimize a route between origin and destination
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Request Parameters */}
              <div>
                <h4 className="font-semibold mb-3">Request Body Parameters</h4>
                <div className="space-y-3">
                  <div className="border-l-2 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono">origin</code>
                      <Badge variant="destructive" className="text-xs">required</Badge>
                      <Badge variant="outline" className="text-xs">array</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Starting point as [latitude, longitude]. Example: [-1.2921, 36.8219]
                    </p>
                  </div>

                  <div className="border-l-2 border-primary pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono">destination</code>
                      <Badge variant="destructive" className="text-xs">required</Badge>
                      <Badge variant="outline" className="text-xs">array</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Ending point as [latitude, longitude]. Example: [-1.2864, 36.8172]
                    </p>
                  </div>

                  <div className="border-l-2 border-muted pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono">vehicle_type</code>
                      <Badge variant="secondary" className="text-xs">optional</Badge>
                      <Badge variant="outline" className="text-xs">string</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Vehicle type: "car", "truck", "van", "motorcycle", "bicycle". Default: "car"
                    </p>
                  </div>

                  <div className="border-l-2 border-muted pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono">optimize_for</code>
                      <Badge variant="secondary" className="text-xs">optional</Badge>
                      <Badge variant="outline" className="text-xs">string</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Optimization criteria: "time", "distance", "cost", "emissions". Default: "time"
                    </p>
                  </div>

                  <div className="border-l-2 border-muted pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono">waypoints</code>
                      <Badge variant="secondary" className="text-xs">optional</Badge>
                      <Badge variant="outline" className="text-xs">array</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Intermediate stops as array of [lat, lng] coordinates
                    </p>
                  </div>

                  <div className="border-l-2 border-muted pl-4">
                    <div className="flex items-center gap-2 mb-1">
                      <code className="text-sm font-mono">find_alternatives</code>
                      <Badge variant="secondary" className="text-xs">optional</Badge>
                      <Badge variant="outline" className="text-xs">boolean</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Whether to return alternative routes. Default: true
                    </p>
                  </div>
                </div>
              </div>

              {/* Response Format */}
              <div>
                <h4 className="font-semibold mb-3">Response Format</h4>
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                  <pre className="text-xs">
{`{
  "data": {
    "baseline_route": {
      "route_id": "baseline",
      "coordinates": [{"lat": -1.2921, "lng": 36.8219}, ...],
      "distance": 5.2,
      "estimated_time": 12.5,
      "cost": 0.78,
      "co2_emissions": 0.62,
      "algorithm_used": "baseline_osrm"
    },
    "optimized_route": {
      "route_id": "optimized",
      "coordinates": [{"lat": -1.2921, "lng": 36.8219}, ...],
      "distance": 4.8,
      "estimated_time": 11.2,
      "cost": 0.72,
      "co2_emissions": 0.58,
      "algorithm_used": "optimized_time",
      "confidence_score": 0.95
    },
    "improvements": {
      "distance_saved": 0.4,
      "time_saved": 1.3,
      "cost_saved": 0.06,
      "co2_saved": 0.04
    },
    "traffic_info": {
      "current_hour_utc": 14,
      "area_type": "commercial",
      "traffic_level": 1.1,
      "traffic_description": "Moderate traffic"
    },
    "amenities": [
      {
        "type": "restaurant",
        "priority": "high",
        "reason": "Lunch options available"
      }
    ]
  },
  "metadata": {
    "algorithm_used": "enhanced_osrm",
    "processing_time": 245,
    "request_id": "req_1234567890"
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Error Responses */}
              <div>
                <h4 className="font-semibold mb-3">Error Responses</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 text-sm">
                    <Badge variant="destructive">401</Badge>
                    <span className="text-muted-foreground">Unauthorized - Invalid or missing API key</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Badge variant="destructive">429</Badge>
                    <span className="text-muted-foreground">Rate Limit Exceeded - Too many requests</span>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Badge variant="destructive">500</Badge>
                    <span className="text-muted-foreground">Server Error - Route optimization failed</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rate Limits */}
          <Card>
            <CardHeader>
              <CardTitle>Rate Limits</CardTitle>
              <CardDescription>
                Request limits based on your subscription tier
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Trial</span>
                  <span className="text-muted-foreground">5 requests/minute, 100/month</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Starter</span>
                  <span className="text-muted-foreground">10 requests/minute, 1,000/month</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b">
                  <span className="font-medium">Professional</span>
                  <span className="text-muted-foreground">50 requests/minute, 10,000/month</span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="font-medium">Enterprise</span>
                  <span className="text-muted-foreground">200 requests/minute, 100,000/month</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Code Examples */}
        <TabsContent value="examples" className="space-y-6">
          {/* JavaScript/Node.js */}
          <Card>
            <CardHeader>
              <CardTitle>JavaScript / Node.js</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`const axios = require('axios');

const optimizeRoute = async () => {
  try {
    const response = await axios.post(
      'https://swift-route-liard.vercel.app/api/v1/optimize-route',
      {
        origin: [-1.2921, 36.8219],
        destination: [-1.2864, 36.8172],
        vehicle_type: 'car',
        optimize_for: 'time'
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.SWIFTROUTE_API_KEY
        }
      }
    );
    
    console.log('Optimized Route:', response.data);
    console.log('Distance Saved:', response.data.data.improvements.distance_saved, 'km');
    console.log('Time Saved:', response.data.data.improvements.time_saved, 'min');
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
};

optimizeRoute();`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* Python */}
          <Card>
            <CardHeader>
              <CardTitle>Python</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`import requests
import os

def optimize_route():
    url = 'https://swift-route-liard.vercel.app/api/v1/optimize-route'
    headers = {
        'Content-Type': 'application/json',
        'X-API-Key': os.environ.get('SWIFTROUTE_API_KEY')
    }
    payload = {
        'origin': [-1.2921, 36.8219],
        'destination': [-1.2864, 36.8172],
        'vehicle_type': 'car',
        'optimize_for': 'time'
    }
    
    response = requests.post(url, json=payload, headers=headers)
    
    if response.status_code == 200:
        data = response.json()
        print(f"Distance Saved: {data['data']['improvements']['distance_saved']} km")
        print(f"Time Saved: {data['data']['improvements']['time_saved']} min")
        print(f"CO2 Saved: {data['data']['improvements']['co2_saved']} kg")
    else:
        print(f"Error: {response.status_code} - {response.text}")

optimize_route()`}
                </pre>
              </div>
            </CardContent>
          </Card>

          {/* PHP */}
          <Card>
            <CardHeader>
              <CardTitle>PHP</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
{`<?php

$apiKey = getenv('SWIFTROUTE_API_KEY');
$url = 'https://swift-route-liard.vercel.app/api/v1/optimize-route';

$data = [
    'origin' => [-1.2921, 36.8219],
    'destination' => [-1.2864, 36.8172],
    'vehicle_type' => 'car',
    'optimize_for' => 'time'
];

$options = [
    'http' => [
        'header' => [
            'Content-Type: application/json',
            'X-API-Key: ' . $apiKey
        ],
        'method' => 'POST',
        'content' => json_encode($data)
    ]
];

$context = stream_context_create($options);
$result = file_get_contents($url, false, $context);
$response = json_decode($result, true);

echo "Distance Saved: " . $response['data']['improvements']['distance_saved'] . " km\\n";
echo "Time Saved: " . $response['data']['improvements']['time_saved'] . " min\\n";

?>`}
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Postman Testing */}
        <TabsContent value="postman" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Testing with Postman</CardTitle>
              <CardDescription>
                Step-by-step guide to test SwiftRoute API using Postman
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Method 1: Using API Key */}
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Method 1: Using API Key (Recommended)
                </h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step 1: Get Your API Key</p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Go to the "API Keys" tab in your dashboard</li>
                      <li>• Click "Generate New Key"</li>
                      <li>• Copy the key (starts with sk_live_...)</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step 2: Configure Postman Request</p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Create a new POST request</li>
                      <li>• URL: <code className="bg-muted px-2 py-0.5 rounded text-xs">https://swift-route-liard.vercel.app/api/v1/optimize-route</code></li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step 3: Add Headers</p>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-400">Key:</span> Content-Type
                        </div>
                        <div>
                          <span className="text-gray-400">Value:</span> application/json
                        </div>
                        <div>
                          <span className="text-gray-400">Key:</span> X-API-Key
                        </div>
                        <div>
                          <span className="text-gray-400">Value:</span> sk_live_your_api_key_here
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step 4: Add Request Body (JSON)</p>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                      <pre className="text-xs">
{`{
  "origin": [-1.2921, 36.8219],
  "destination": [-1.2864, 36.8172],
  "vehicle_type": "car",
  "optimize_for": "time"
}`}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step 5: Send Request</p>
                    <p className="text-sm text-muted-foreground ml-4">
                      Click "Send" and you should receive a 200 OK response with optimized route data
                    </p>
                  </div>
                </div>
              </div>

              {/* Method 2: Using Bearer Token */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  Method 2: Using Bearer Token (Dashboard Session)
                </h4>
                <Alert className="mb-3">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This method uses your dashboard login session. The token expires after your session ends.
                  </AlertDescription>
                </Alert>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step 1: Get Your Session Token</p>
                    <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                      <li>• Open your browser's Developer Tools (F12)</li>
                      <li>• Go to the "Application" or "Storage" tab</li>
                      <li>• Find "Local Storage" → your domain</li>
                      <li>• Look for Supabase auth token (usually in a key like "sb-*-auth-token")</li>
                      <li>• Copy the "access_token" value from the JSON</li>
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step 2: Configure Postman Headers</p>
                    <div className="bg-gray-900 text-gray-100 p-3 rounded-lg text-xs">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <span className="text-gray-400">Key:</span> Content-Type
                        </div>
                        <div>
                          <span className="text-gray-400">Value:</span> application/json
                        </div>
                        <div>
                          <span className="text-gray-400">Key:</span> Authorization
                        </div>
                        <div>
                          <span className="text-gray-400">Value:</span> Bearer your_access_token_here
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm font-medium">Step 3: Use Same Request Body</p>
                    <p className="text-sm text-muted-foreground ml-4">
                      Use the same JSON body as Method 1
                    </p>
                  </div>
                </div>
              </div>

              {/* Expected Response */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Expected Response (200 OK)</h4>
                <div className="bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto">
                  <pre className="text-xs">
{`{
  "data": {
    "baseline_route": {
      "distance": 5.2,
      "estimated_time": 12.5,
      "cost": 0.78,
      "co2_emissions": 0.62
    },
    "optimized_route": {
      "distance": 4.8,
      "estimated_time": 11.2,
      "cost": 0.72,
      "co2_emissions": 0.58
    },
    "improvements": {
      "distance_saved": 0.4,
      "time_saved": 1.3,
      "cost_saved": 0.06,
      "co2_saved": 0.04
    }
  }
}`}
                  </pre>
                </div>
              </div>

              {/* Common Errors */}
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3">Common Errors</h4>
                <div className="space-y-2">
                  <div className="flex items-start gap-3 text-sm">
                    <Badge variant="destructive">401</Badge>
                    <div>
                      <p className="font-medium">Unauthorized</p>
                      <p className="text-muted-foreground">Check your API key or Bearer token is correct</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Badge variant="destructive">400</Badge>
                    <div>
                      <p className="font-medium">Bad Request</p>
                      <p className="text-muted-foreground">Verify your JSON body format and coordinate values</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <Badge variant="destructive">429</Badge>
                    <div>
                      <p className="font-medium">Rate Limit Exceeded</p>
                      <p className="text-muted-foreground">Wait a minute or check your subscription tier limits</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Tips */}
              <Alert>
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-medium mb-2">Pro Tips:</p>
                  <ul className="text-sm space-y-1">
                    <li>• Save your request as a Postman Collection for reuse</li>
                    <li>• Use Postman Environment Variables for your API key</li>
                    <li>• Test different vehicle types and optimization criteria</li>
                    <li>• Check the "Analytics" tab to see your test requests</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integration Guide */}
        <TabsContent value="integration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Integration Best Practices
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Security */}
              <div>
                <h4 className="font-semibold mb-3">Security</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Store API keys in environment variables, never in code</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use HTTPS for all API requests</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Rotate API keys regularly for production systems</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Never expose API keys in client-side JavaScript</span>
                  </li>
                </ul>
              </div>

              {/* Error Handling */}
              <div>
                <h4 className="font-semibold mb-3">Error Handling</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Implement exponential backoff for rate limit errors (429)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Handle network timeouts gracefully (10s timeout recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Log errors with request IDs for debugging</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Provide fallback routes when optimization fails</span>
                  </li>
                </ul>
              </div>

              {/* Performance */}
              <div>
                <h4 className="font-semibold mb-3">Performance Optimization</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Cache route results for frequently requested routes (1 hour recommended)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Batch multiple route requests when possible</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use webhooks for long-running optimizations (Enterprise tier)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Monitor your usage to avoid unexpected overage charges</span>
                  </li>
                </ul>
              </div>

              {/* Testing */}
              <div>
                <h4 className="font-semibold mb-3">Testing</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Use trial tier for development and testing</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Test with various coordinate ranges and vehicle types</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Verify traffic and amenity data in different time zones</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span>Test error scenarios (invalid coordinates, rate limits)</span>
                  </li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Support */}
          <Card>
            <CardHeader>
              <CardTitle>Need Help?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-muted-foreground">
                If you encounter issues or have questions about integration:
              </p>
              <ul className="space-y-2 text-sm">
                <li>• Check the Analytics tab for usage and error logs</li>
                <li>• Review your API key status in the API Keys tab</li>
                <li>• Verify your subscription tier supports your use case</li>
                <li>• Contact support with your request ID for faster resolution</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
