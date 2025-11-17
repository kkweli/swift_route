/**
 * JSONOutputPanel Component
 * Display formatted API response with syntax highlighting and code examples
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, Download, Code, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RouteOptimizationResponse } from '@/lib/route-api';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

export interface JSONOutputPanelProps {
  response: RouteOptimizationResponse | null;
  apiKey?: string;
}

export function JSONOutputPanel({ response, apiKey = 'YOUR_API_KEY' }: JSONOutputPanelProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);

  if (!response) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            API Response
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Optimize a route to see the JSON API response
          </p>
        </CardContent>
      </Card>
    );
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({
      title: 'Copied to clipboard',
      description: 'Code copied successfully',
    });
  };

  const downloadJSON = () => {
    const blob = new Blob([JSON.stringify(response, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `swiftroute-optimization-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const jsonOutput = JSON.stringify(response, null, 2);

  const javascriptExample = `// JavaScript/TypeScript Example
import { RouteAPIClient } from './route-api';

const client = new RouteAPIClient('${apiKey}');

const response = await client.optimizeRoute({
  origin: [${response.data.baseline_route.coordinates[0]?.lat.toFixed(4)}, ${response.data.baseline_route.coordinates[0]?.lng.toFixed(4)}],
  destination: [${response.data.baseline_route.coordinates[response.data.baseline_route.coordinates.length - 1]?.lat.toFixed(4)}, ${response.data.baseline_route.coordinates[response.data.baseline_route.coordinates.length - 1]?.lng.toFixed(4)}],
  vehicle_type: 'car',
  optimize_for: 'distance'
});

console.log('Distance saved:', response.data.improvements.distance_saved, 'km');
console.log('CO₂ saved:', response.data.improvements.co2_saved, 'kg');`;

  const pythonExample = `# Python Example
import requests

url = "https://api.swiftroute.com/api/v1/optimize-route/optimize"
headers = {
    "Authorization": "Bearer ${apiKey}",
    "Content-Type": "application/json"
}

payload = {
    "origin": [${response.data.baseline_route.coordinates[0]?.lat.toFixed(4)}, ${response.data.baseline_route.coordinates[0]?.lng.toFixed(4)}],
    "destination": [${response.data.baseline_route.coordinates[response.data.baseline_route.coordinates.length - 1]?.lat.toFixed(4)}, ${response.data.baseline_route.coordinates[response.data.baseline_route.coordinates.length - 1]?.lng.toFixed(4)}],
    "vehicle_type": "car",
    "optimize_for": "distance"
}

response = requests.post(url, json=payload, headers=headers)
data = response.json()

print(f"Distance saved: {data['data']['improvements']['distance_saved']} km")
print(f"CO₂ saved: {data['data']['improvements']['co2_saved']} kg")`;

  const curlExample = `curl -X POST https://api.swiftroute.com/api/v1/optimize-route/optimize \\
  -H "Authorization: Bearer ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "origin": [${response.data.baseline_route.coordinates[0]?.lat.toFixed(4)}, ${response.data.baseline_route.coordinates[0]?.lng.toFixed(4)}],
    "destination": [${response.data.baseline_route.coordinates[response.data.baseline_route.coordinates.length - 1]?.lat.toFixed(4)}, ${response.data.baseline_route.coordinates[response.data.baseline_route.coordinates.length - 1]?.lng.toFixed(4)}],
    "vehicle_type": "car",
    "optimize_for": "distance"
  }'`;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Code className="h-5 w-5" />
            <CardTitle>API Response & Integration</CardTitle>
            <Badge variant="secondary">JSON</Badge>
          </div>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => copyToClipboard(jsonOutput)}
            >
              {copied ? (
                <Check className="h-4 w-4 mr-1" />
              ) : (
                <Copy className="h-4 w-4 mr-1" />
              )}
              {copied ? 'Copied!' : 'Copy'}
            </Button>
            <Button size="sm" variant="outline" onClick={downloadJSON}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="json" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="json">JSON</TabsTrigger>
            <TabsTrigger value="javascript">JavaScript</TabsTrigger>
            <TabsTrigger value="python">Python</TabsTrigger>
            <TabsTrigger value="curl">cURL</TabsTrigger>
          </TabsList>

          <TabsContent value="json" className="mt-4">
            <div className="max-h-96 overflow-auto rounded-lg">
              <SyntaxHighlighter
                language="json"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {jsonOutput}
              </SyntaxHighlighter>
            </div>
          </TabsContent>

          <TabsContent value="javascript" className="mt-4">
            <div className="max-h-96 overflow-auto rounded-lg">
              <SyntaxHighlighter
                language="typescript"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {javascriptExample}
              </SyntaxHighlighter>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => copyToClipboard(javascriptExample)}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy Code
            </Button>
          </TabsContent>

          <TabsContent value="python" className="mt-4">
            <div className="max-h-96 overflow-auto rounded-lg">
              <SyntaxHighlighter
                language="python"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {pythonExample}
              </SyntaxHighlighter>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => copyToClipboard(pythonExample)}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy Code
            </Button>
          </TabsContent>

          <TabsContent value="curl" className="mt-4">
            <div className="max-h-96 overflow-auto rounded-lg">
              <SyntaxHighlighter
                language="bash"
                style={vscDarkPlus}
                customStyle={{
                  margin: 0,
                  borderRadius: '0.5rem',
                  fontSize: '0.875rem',
                }}
              >
                {curlExample}
              </SyntaxHighlighter>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-2"
              onClick={() => copyToClipboard(curlExample)}
            >
              <Copy className="h-4 w-4 mr-1" />
              Copy Command
            </Button>
          </TabsContent>
        </Tabs>

        {/* API Info */}
        <div className="mt-4 p-3 bg-muted rounded-lg text-sm">
          <h4 className="font-medium mb-2">API Endpoint</h4>
          <code className="text-xs bg-background px-2 py-1 rounded">
            POST /api/v1/optimize-route/optimize
          </code>
          <p className="text-muted-foreground mt-2 text-xs">
            Authentication: Bearer token in Authorization header
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
