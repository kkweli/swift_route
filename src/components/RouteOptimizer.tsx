/**
 * RouteOptimizer Component
 * Main orchestrator component for route optimization feature
 */

import { useState, useEffect, useCallback } from 'react';
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
  RouteAPIError,
} from '@/lib/route-api';
import { EXAMPLE_ROUTES, ExampleRoute } from '@/lib/example-routes';
import { buildInsightsPrompt, buildContextPrompt, fetchLLMInsights } from '@/lib/route-insights';
import ReactMarkdown from 'react-markdown';

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
  const [showInsights, setShowInsights] = useState<boolean>(true);
  const [isInsightsLoading, setIsInsightsLoading] = useState<boolean>(false);
  const [llmContextMarkdown, setLlmContextMarkdown] = useState<string | null>(null);
  const [isContextLoading, setIsContextLoading] = useState<boolean>(false);
  const [showContext, setShowContext] = useState<boolean>(true);

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
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [isCreatingTrial, setIsCreatingTrial] = useState(false);

  // Fetch subscription data and set up API key from auth token
  const fetchSubscription = useCallback(async () => {
    if (!user) return;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const response = await fetch('/api/v1/billing/subscription', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.data) {
          setSubscription({
            tier: data.data.tier || 'trial',
            requests_remaining: data.data.requests_remaining ?? 100,
            monthly_requests_included: data.data.monthly_requests_included || 100,
            trial_end_date: data.data.trial_end_date,
          });
        } else {
          setSubscription({
            tier: 'trial',
            requests_remaining: 100,
            monthly_requests_included: 100,
          });
        }
      } else {
        setSubscription({
          tier: 'trial',
          requests_remaining: 100,
          monthly_requests_included: 100,
        });
      }
    } catch (error: unknown) {
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
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setApiKey(session.access_token);
        }
      }
    } catch (error) {
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

      const response = await fetch('/api/v1/keys', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        const activeKeys = ((data.data as Array<{ status?: string }>) || []).filter((k) => k.status === 'active');

        if (activeKeys.length > 0) {
          setApiKey(session.access_token);
        } else if (subscription.tier === 'trial') {
          await createTrialKey();
        } else {
          setApiKey(session.access_token);
        }
      } else {
        setApiKey(session.access_token);
      }
    } catch (error: unknown) {
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
      await setupAPIKey();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: 'Authentication Required',
          description: 'Please log in to use the route optimizer',
          variant: 'destructive',
        });
        return;
      }
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
      setLlmExplanation(null);
      setSelectedRoute('optimized');

      console.log('🎯 API Response Data:', {
        baselineRouteCount: response.data.baseline_route?.coordinates?.length,
        optimizedRouteCount: response.data.optimized_route?.coordinates?.length,
        alternativeRoutesCount: response.data.alternative_routes?.length,
        baselineCoords: response.data.baseline_route?.coordinates?.slice(0, 3),
        optimizedCoords: response.data.optimized_route?.coordinates?.slice(0, 3)
      });

      setSubscription({
        ...subscription,
        requests_remaining: Math.max(0, subscription.requests_remaining - 1),
      });

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

  // Debounced LLM insights generation
  useEffect(() => {
    if (!apiResponse) return;

    const debounceMsRaw = import.meta.env.VITE_GEMINI_DEBOUNCE_MS as unknown as string | undefined;
    const debounceMs = Math.max(0, Number(debounceMsRaw ?? '600'));
    setIsInsightsLoading(true);
    setIsContextLoading(true);
    const tid = setTimeout(async () => {
      try {
        const timeoutEnv = import.meta.env.VITE_GEMINI_TIMEOUT_MS as unknown as string | undefined;
        const modelEnv = import.meta.env.VITE_GEMINI_MODEL as unknown as string | undefined;

        const analysisPrompt = buildInsightsPrompt(apiResponse, {
          vehicleType: parameters.vehicleType,
          optimizeFor: parameters.optimizeFor,
        });
        const analysis = await fetchLLMInsights(analysisPrompt, {
          timeoutMs: Number(timeoutEnv ?? '4000'),
          model: modelEnv || 'gemini-1.5-flash',
          temperature: 0.3,
          maxOutputTokens: 400,
        });
        if (analysis) setLlmExplanation(analysis);

        const contextPrompt = buildContextPrompt(apiResponse, {
          vehicleType: parameters.vehicleType,
          optimizeFor: parameters.optimizeFor,
        });
        const context = await fetchLLMInsights(contextPrompt, {
          timeoutMs: Number(timeoutEnv ?? '4000'),
          model: modelEnv || 'gemini-1.5-flash',
          temperature: 0.3,
          maxOutputTokens: 450,
        });
        if (context) setLlmContextMarkdown(context);
      } catch (e) {
        console.warn('LLM insights/context debounced call failed:', e);
      } finally {
        setIsInsightsLoading(false);
        setIsContextLoading(false);
      }
    }, debounceMs);
    return () => clearTimeout(tid);
  }, [apiResponse, parameters.vehicleType, parameters.optimizeFor]);

  const summarizeAmenities = useCallback(() => {
    const amenities = apiResponse?.data?.amenities || [];
    const counts: Record<string, number> = {};
    for (const a of amenities) {
      counts[a.type] = (counts[a.type] || 0) + 1;
    }
    return counts;
  }, [apiResponse]);

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
              alternativeRoutes={alternativeRoutes?.map(r => r.coordinates) || []}
              onMapClick={handleMapClick}
              selectedRoute={selectedRoute}
            />
          </div>
        </div>
      </div>

      {/* Results Section */}
      {(baselineRoute || optimizedRoute) && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MetricsComparison
              baselineRoute={baselineRoute}
              optimizedRoute={optimizedRoute}
              alternativeRoutes={alternativeRoutes}
              llmExplanation={llmExplanation}
              isTrialUser={subscription.tier === 'trial'}
              selectedRoute={selectedRoute}
              onSelectedRouteChange={setSelectedRoute}
            />
            <JSONOutputPanel response={apiResponse} apiKey={apiKey || undefined} />
          </div>

          {/* AI Route Analysis */}
          <div className="mt-6 p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">AI Route Analysis</h3>
              <div className="flex items-center gap-2">
                {isInsightsLoading && <span className="text-xs text-muted-foreground">loading…</span>}
                <Button variant="secondary" onClick={() => setShowInsights(!showInsights)}>
                  {showInsights ? 'Hide' : 'Show'} Insights
                </Button>
              </div>
            </div>
            {showInsights && (
              <div className="prose prose-sm dark:prose-invert mt-3">
                {llmExplanation ? (
                  <ReactMarkdown>{llmExplanation}</ReactMarkdown>
                ) : (
                  <p className="text-sm text-muted-foreground">Insights will appear here after optimization.</p>
                )}
              </div>
            )}
          </div>

          {/* Route Context */}
          <div className="mt-4 p-4 border rounded-lg bg-card">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Route Context</h3>
              <div className="flex items-center gap-2">
                {isContextLoading && <span className="text-xs text-muted-foreground">loading…</span>}
                <Button variant="secondary" onClick={() => setShowContext(!showContext)}>
                  {showContext ? 'Hide' : 'Show'} Context
                </Button>
              </div>
            </div>
            {showContext && (
              <div className="prose prose-sm dark:prose-invert mt-3">
                {llmContextMarkdown ? (
                  <ReactMarkdown>{llmContextMarkdown}</ReactMarkdown>
                ) : (
                  <p className="text-sm text-muted-foreground">Traffic and amenities context will appear here.</p>
                )}
              </div>
            )}
          </div>
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