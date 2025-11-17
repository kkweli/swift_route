/**
 * RouteOptimizer Component
 * Main orchestrator component for route optimization feature
 */

import { useState, useEffect } from 'react';
import { InteractiveMap, LatLng } from './InteractiveMap';
import { RouteInputPanel, OptimizationParameters, SubscriptionData } from './RouteInputPanel';
import { MetricsComparison } from './MetricsComparison';
import { JSONOutputPanel } from './JSONOutputPanel';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  RouteAPIClient,
  RouteOptimizationResponse,
  RouteResult,
  formatRouteAPIError,
} from '@/lib/route-api';
import { EXAMPLE_ROUTES, ExampleRoute } from '@/lib/example-routes';

export function RouteOptimizer() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Route state
  const [origin, setOrigin] = useState<LatLng | null>(null);
  const [destination, setDestination] = useState<LatLng | null>(null);
  const [waypoints, setWaypoints] = useState<LatLng[]>([]);

  // Optimization parameters
  const [parameters, setParameters] = useState<OptimizationParameters>({
    vehicleType: 'car',
    optimizeFor: 'distance',
    avoidTolls: false,
    avoidTraffic: false,
  });

  // Results state
  const [baselineRoute, setBaselineRoute] = useState<RouteResult | null>(null);
  const [optimizedRoute, setOptimizedRoute] = useState<RouteResult | null>(null);
  const [apiResponse, setApiResponse] = useState<RouteOptimizationResponse | null>(null);

  // UI state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<'baseline' | 'optimized' | null>(null);

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'trial',
    requests_remaining: 100,
    monthly_requests_included: 100,
  });

  // API key state
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [availableKeys, setAvailableKeys] = useState<Array<{id: string, name: string, key_prefix: string, full_key?: string}>>([]);
  const [selectedKeyId, setSelectedKeyId] = useState<string | null>(null);
  const [isCreatingTrial, setIsCreatingTrial] = useState(false);

  // Fetch subscription data
  useEffect(() => {
    fetchSubscription();
    fetchAPIKey();
  }, [user]);

  const fetchSubscription = async () => {
    if (!user) {
      // User must be logged in to use the route optimizer
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/v1/billing/subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription({
          tier: data.data.tier || 'trial',
          requests_remaining: data.data.requests_remaining || 100,
          monthly_requests_included: data.data.monthly_requests_included || 100,
          trial_end_date: data.data.trial_end_date,
        });
      }
    } catch (error) {
      console.error('Error fetching subscription:', error);
    }
  };

  const fetchAPIKey = async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/v1/keys', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.length > 0) {
          const activeKeys = data.data.filter((k: any) => k.status === 'active');
          setAvailableKeys(activeKeys.map((k: any) => ({
            id: k.id,
            name: k.name,
            key_prefix: k.key_prefix,
            full_key: k.key // This will only be available for newly created keys
          })));
          
          // Auto-select first key if none selected
          if (activeKeys.length > 0 && !selectedKeyId) {
            setSelectedKeyId(activeKeys[0].id);
            // Note: We can't get the full key from the list, user needs to store it
          }
        } else {
          // No keys found - only create trial if user doesn't have a paid subscription
          // For paid users, they need to create a key manually from the API Keys tab
          if (subscription.tier === 'trial') {
            await createTrialKey();
          } else {
            toast({
              title: 'No API Keys Found',
              description: 'Please create an API key in the API Keys tab to use the route optimizer',
              variant: 'destructive',
            });
          }
        }
      }
    } catch (error) {
      console.error('Error fetching API key:', error);
    }
  };

  const createTrialKey = async () => {
    if (!user || isCreatingTrial) return;

    setIsCreatingTrial(true);
    try {
      const response = await fetch('/api/v1/optimize-route/trial/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          email: user.email,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.api_key) {
          const trialKey = {
            id: data.data.key_id || 'trial',
            name: 'Trial API Key',
            key_prefix: data.data.api_key.substring(0, 15) + '...',
            full_key: data.data.api_key
          };
          
          setApiKey(data.data.api_key);
          setAvailableKeys([trialKey]);
          setSelectedKeyId(trialKey.id);
          
          setSubscription({
            tier: 'trial',
            requests_remaining: data.data.requests_remaining,
            monthly_requests_included: data.data.requests_limit,
            trial_end_date: data.data.trial_end_date,
          });
          
          toast({
            title: 'Trial Started!',
            description: `You have ${data.data.requests_limit} requests for 14 days`,
          });
        }
      }
    } catch (error) {
      console.error('Error creating trial key:', error);
      toast({
        title: 'Failed to create trial',
        description: 'Please try again or contact support',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingTrial(false);
    }
  };

  // Handle API key selection
  const handleKeySelection = (keyId: string) => {
    setSelectedKeyId(keyId);
    const selectedKey = availableKeys.find(k => k.id === keyId);
    if (selectedKey?.full_key) {
      setApiKey(selectedKey.full_key);
    } else {
      // Key not available, user needs to re-enter it
      toast({
        title: 'API Key Required',
        description: 'Please enter the full API key for this selection',
        variant: 'destructive'
      });
    }
  };

  // Handle map clicks
  const handleMapClick = (latlng: LatLng) => {
    if (!origin) {
      setOrigin(latlng);
      toast({
        title: 'Origin set',
        description: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
      });
    } else if (!destination) {
      setDestination(latlng);
      toast({
        title: 'Destination set',
        description: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
      });
    } else {
      // Add as waypoint if allowed
      const isTrialUser = subscription.tier === 'trial';
      if (!isTrialUser || waypoints.length < 3) {
        setWaypoints([...waypoints, latlng]);
        toast({
          title: 'Waypoint added',
          description: `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`,
        });
      } else {
        toast({
          title: 'Trial Limit Reached',
          description: 'Upgrade to add more than 3 waypoints',
          variant: 'destructive',
        });
      }
    }
  };

  // Handle waypoint management
  const handleAddWaypoint = () => {
    toast({
      title: 'Click on map',
      description: 'Click on the map to add a waypoint',
    });
  };

  const handleRemoveWaypoint = (index: number) => {
    setWaypoints(waypoints.filter((_, i) => i !== index));
    toast({
      title: 'Waypoint removed',
    });
  };

  // Handle parameter changes
  const handleParametersChange = (params: Partial<OptimizationParameters>) => {
    setParameters({ ...parameters, ...params });
  };

  // Handle route optimization
  const handleOptimize = async () => {
    if (!origin || !destination) {
      toast({
        title: 'Missing coordinates',
        description: 'Please set both origin and destination',
        variant: 'destructive',
      });
      return;
    }

    if (!apiKey) {
      if (subscription.tier === 'trial') {
        toast({
          title: 'No API Key',
          description: 'Creating trial subscription...',
        });
        await createTrialKey();
      } else {
        toast({
          title: 'No API Key',
          description: 'Please create an API key in the API Keys tab or enter your existing key',
          variant: 'destructive',
        });
      }
      return;
    }

    if (subscription.requests_remaining <= 0) {
      toast({
        title: 'No requests remaining',
        description: 'Please upgrade your plan to continue',
        variant: 'destructive',
      });
      return;
    }

    setIsOptimizing(true);
    setBaselineRoute(null);
    setOptimizedRoute(null);
    setApiResponse(null);

    try {
      const client = new RouteAPIClient(apiKey);

      const response = await client.optimizeRoute({
        origin: RouteAPIClient.toCoordinateTuple(origin),
        destination: RouteAPIClient.toCoordinateTuple(destination),
        waypoints: waypoints.map(RouteAPIClient.toCoordinateTuple),
        vehicle_type: parameters.vehicleType,
        optimize_for: parameters.optimizeFor,
        avoid_tolls: parameters.avoidTolls,
        avoid_traffic: parameters.avoidTraffic,
      });

      setApiResponse(response);
      setBaselineRoute(response.data.baseline_route);
      setOptimizedRoute(response.data.optimized_route);
      setSelectedRoute('optimized');

      // Update subscription data
      setSubscription({
        ...subscription,
        requests_remaining: response.usage.requests_remaining,
      });

      toast({
        title: 'Route optimized!',
        description: `Saved ${response.data.improvements.distance_saved.toFixed(1)} km and ${response.data.improvements.co2_saved.toFixed(2)} kg CO₂`,
      });
    } catch (error: any) {
      console.error('Optimization error:', error);
      toast({
        title: 'Optimization failed',
        description: formatRouteAPIError(error),
        variant: 'destructive',
      });
    } finally {
      setIsOptimizing(false);
    }
  };

  // Handle example route loading
  const handleLoadExample = (exampleId: string) => {
    const example = EXAMPLE_ROUTES.find((r) => r.id === exampleId);
    if (!example) return;

    setOrigin(example.origin);
    setDestination(example.destination);
    setWaypoints(example.waypoints);
    setParameters(example.parameters);
    setBaselineRoute(null);
    setOptimizedRoute(null);
    setApiResponse(null);

    toast({
      title: 'Example loaded',
      description: `${example.name} - ${example.industry}`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Example Routes Bar */}
      <div className="flex items-center gap-4 p-4 bg-card rounded-lg border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="font-medium">Try an Example:</span>
        </div>
        <Select onValueChange={handleLoadExample}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Load example route..." />
          </SelectTrigger>
          <SelectContent>
            {EXAMPLE_ROUTES.map((example) => (
              <SelectItem key={example.id} value={example.id}>
                <div className="flex flex-col">
                  <span className="font-medium">{example.name}</span>
                  <span className="text-xs text-muted-foreground">{example.industry}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Badge variant="secondary" className="ml-auto">
          {EXAMPLE_ROUTES.length} examples available
        </Badge>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Input Controls */}
        <div className="lg:col-span-1">
          <RouteInputPanel
            origin={origin}
            destination={destination}
            waypoints={waypoints}
            parameters={parameters}
            subscription={subscription}
            isOptimizing={isOptimizing}
            onOriginChange={setOrigin}
            onDestinationChange={setDestination}
            onAddWaypoint={handleAddWaypoint}
            onRemoveWaypoint={handleRemoveWaypoint}
            onParametersChange={handleParametersChange}
            onOptimize={handleOptimize}
          />
        </div>

        {/* Right Panel - Map */}
        <div className="lg:col-span-2">
          <div className="h-[600px] rounded-lg overflow-hidden shadow-lg">
            <InteractiveMap
              origin={origin}
              destination={destination}
              waypoints={waypoints}
              baselineRoute={baselineRoute?.coordinates || null}
              optimizedRoute={optimizedRoute?.coordinates || null}
              onMapClick={handleMapClick}
              selectedRoute={selectedRoute}
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(baselineRoute || optimizedRoute) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Metrics Comparison */}
          <MetricsComparison
            baselineRoute={baselineRoute}
            optimizedRoute={optimizedRoute}
            isTrialUser={subscription.tier === 'trial'}
          />

          {/* JSON Output */}
          <JSONOutputPanel response={apiResponse} apiKey={apiKey || undefined} />
        </div>
      )}

      {/* Help Text */}
      {!origin && !destination && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            Click on the map to set your origin and destination, then click "Optimize Route" to see
            the results.
          </p>
        </div>
      )}
    </div>
  );
}
