/**
 * RouteOptimizer Component
 * Main orchestrator component for route optimization feature
 */

import { useState, useEffect, useCallback } from 'react';
import { InteractiveMap, LatLng } from './InteractiveMap';
import { RouteInputPanel, OptimizationParameters, SubscriptionData } from './RouteInputPanel';
import { MetricsComparison } from './MetricsComparison';
import { JSONOutputPanel } from './JSONOutputPanel';
import { TrafficAmenityInfo } from './TrafficAmenityInfo';
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
  RouteAPIError,
} from '@/lib/route-api';
import { EXAMPLE_ROUTES, ExampleRoute } from '@/lib/example-routes';
import { buildInsightsPrompt, fetchLLMInsights } from '@/lib/route-insights';

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
  const [alternativeRoutes, setAlternativeRoutes] = useState<RouteResult[]>([]);
  const [llmExplanation, setLlmExplanation] = useState<string | null>(null);
  const [apiResponse, setApiResponse] = useState<RouteOptimizationResponse | null>(null);

  // UI state
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<'baseline' | 'optimized' | 'alternative-0' | 'alternative-1' | null>(null);

  // Subscription state
  const [subscription, setSubscription] = useState<SubscriptionData>({
    tier: 'trial',
    requests_remaining: 100,
    monthly_requests_included: 100,
  });

  // API key state
  // Note: Dashboard users don't need API keys - they use their session token
  // API keys are only needed for external B2B API integrations
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isCreatingTrial, setIsCreatingTrial] = useState(false);

  // Fetch subscription data and set up API key from auth token
  const fetchSubscription = useCallback(async () => {
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

        // Ensure data.data exists before accessing properties
        if (data && data.data) {
          setSubscription({
            tier: data.data.tier || 'trial',
            requests_remaining: data.data.requests_remaining ?? 100,
            monthly_requests_included: data.data.monthly_requests_included || 100,
            trial_end_date: data.data.trial_end_date,
          });
        } else {
          console.error('Invalid subscription data format:', data);
          // Set default trial subscription
          setSubscription({
            tier: 'trial',
            requests_remaining: 100,
            monthly_requests_included: 100,
          });
        }
      } else {
        console.error('Failed to fetch subscription:', response.status, response.statusText);
        // Set default trial subscription on error
        setSubscription({
          tier: 'trial',
          requests_remaining: 100,
          monthly_requests_included: 100,
        });
      }
    } catch (error: unknown) {
      console.error('Error fetching subscription:', error);
      // Set default trial subscription on exception
      setSubscription({
        tier: 'trial',
        requests_remaining: 100,
        monthly_requests_included: 100,
      });
    }
  }, [user]);

  const createTrialKey = useCallback(async () => {
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
          setApiKey(data.data.api_key);

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
      } else {
        // If trial creation fails, use session token as fallback
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setApiKey(session.access_token);
        }
      }
    } catch (error) {
      console.error('Error creating trial key:', error);
      // Fallback to session token
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setApiKey(session.access_token);
      }
      toast({
        title: 'Using Dashboard Access',
        description: 'You can optimize routes using your dashboard login',
      });
    } finally {
      setIsCreatingTrial(false);
    }
  }, [user, isCreatingTrial, toast]);

  const setupAPIKey = useCallback(async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // For dashboard users, check if they have a trial subscription
      // If trial and no API key exists, create one automatically
      const response = await fetch('/api/v1/keys', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const activeKeys = ((data.data as Array<{ status?: string }>) || []).filter((k) => k.status === 'active');

        if (activeKeys.length > 0) {
          // User has API keys - for dashboard use, we'll use their session token
          // The backend will recognize authenticated users
          setApiKey(session.access_token);
        } else if (subscription.tier === 'trial') {
          // Trial user with no keys - create trial key
          await createTrialKey();
        } else {
          // Paid user with no keys - use session token
          setApiKey(session.access_token);
        }
      } else {
        // If keys endpoint fails, still allow dashboard use with session token
        setApiKey(session.access_token);
      }
    } catch (error: unknown) {
      console.error('Error setting up API key:', error);
      // Fallback: use session token
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setApiKey(session.access_token);
      }
    }
  }, [user, subscription.tier, createTrialKey]);

  useEffect(() => {
    fetchSubscription();
    setupAPIKey();
  }, [fetchSubscription, setupAPIKey, user]);

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
      // Try to set up API key automatically
      await setupAPIKey();

      // Check again after setup
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to use the route optimizer',
          variant: 'destructive',
        });
        return;
      }

      // Use session token as fallback
      setApiKey(session.access_token);
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
    setAlternativeRoutes([]);
    setLlmExplanation(null);
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
        alternatives: 2,
      });

      setApiResponse(response);
      setBaselineRoute(response.data.baseline_route);
      setOptimizedRoute(response.data.optimized_route);
      setAlternativeRoutes(response.data.alternative_routes || []);
      setLlmExplanation(null); // reset; will populate from client-side LLM
      setSelectedRoute('optimized');

      // Fire-and-forget client-side LLM insights (non-blocking)
      (async () => {
        try {
          const prompt = buildInsightsPrompt(response, {
            vehicleType: parameters.vehicleType,
            optimizeFor: parameters.optimizeFor,
          });
          const insights = await fetchLLMInsights(prompt, {
            timeoutMs: 1600,
            model: 'gemini-1.5-flash',
            temperature: 0.4,
            maxOutputTokens: 300,
          });
          if (insights) {
            setLlmExplanation(insights);
          }
        } catch (e) {
          console.warn('Failed to get LLM insights:', e);
        }
      })();

      // Debug: log the received data
      console.log('🎯 API Response Data:', {
        baselineRouteCount: response.data.baseline_route?.coordinates?.length,
        optimizedRouteCount: response.data.optimized_route?.coordinates?.length,
        alternativeRoutesCount: response.data.alternative_routes?.length,
        alternativeCoordinates: response.data.alternative_routes?.map((r: RouteResult, i: number) => ({
          alt: i,
          count: r.coordinates?.length
        }))
      });

      // Update subscription data - decrement requests_remaining locally
      setSubscription({
        ...subscription,
        requests_remaining: Math.max(0, subscription.requests_remaining - 1),
      });

      // Refresh subscription data from server in background
      fetchSubscription();

      toast({
        title: 'Route optimized!',
        description: `Saved ${response.data.improvements.distance_saved.toFixed(1)} km and ${response.data.improvements.co2_saved.toFixed(2)} kg CO₂`,
      });
    } catch (error: unknown) {
      console.error('Optimization error:', error);
      toast({
        title: 'Optimization failed',
        description: error instanceof RouteAPIError ? formatRouteAPIError(error) : (error as Error).message,
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
            {(() => {
              const baselineCoords = baselineRoute?.coordinates || null;
              const optimizedCoords = optimizedRoute?.coordinates || null;
              const altCoords = alternativeRoutes.map(r => r.coordinates);

              return (
                <InteractiveMap
                  origin={origin}
                  destination={destination}
                  waypoints={waypoints}
                  baselineRoute={baselineCoords}
                  optimizedRoute={optimizedCoords}
                  alternativeRoutes={altCoords}
                  onMapClick={handleMapClick}
                  selectedRoute={selectedRoute}
                />
              );
            })()}
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(baselineRoute || optimizedRoute) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Metrics Comparison */}
            <MetricsComparison
              baselineRoute={baselineRoute}
              optimizedRoute={optimizedRoute}
              alternativeRoutes={alternativeRoutes}
              llmExplanation={llmExplanation}
              isTrialUser={subscription.tier === 'trial'}
              selectedRoute={selectedRoute}
              onSelectedRouteChange={setSelectedRoute}
            />

            {/* JSON Output */}
            <JSONOutputPanel response={apiResponse} apiKey={apiKey || undefined} />
          </div>

          {/* Traffic and Amenity Information */}
          <TrafficAmenityInfo
            trafficInfo={apiResponse?.data?.traffic_info}
            amenities={apiResponse?.data?.amenities}
          />
        </>
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
