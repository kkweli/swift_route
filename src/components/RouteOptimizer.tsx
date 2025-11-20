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
          coordinates: {
            origin: origin,
            destination: destination,
            waypoints: waypoints
          }
        });
        const context = await fetchLLMInsights(contextPrompt, {
          timeoutMs: Number(timeoutEnv ?? '4000'),
          model: modelEnv || 'gemini-1.5-flash',
          temperature: 0.3,
          maxOutputTokens: 450,
        });
        if (context) setLlmContextMarkdown(context);
      } catch (e) {

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

      {/* Main Layout - Mobile First */}
      <div className="flex flex-col lg:grid lg:grid-cols-3 gap-4 lg:gap-6">
        {/* Mobile: Map First, Desktop: Left Panel */}
        <div className="order-2 lg:order-1 lg:col-span-1">
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

        {/* Mobile: Show Map First, Desktop: Right Panel */}
        <div className="order-1 lg:order-2 lg:col-span-2">
          <div className="h-[400px] sm:h-[500px] lg:h-[600px] rounded-lg overflow-hidden shadow-lg">
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

      {/* Results Section - Mobile Optimized */}
      {(baselineRoute || optimizedRoute) && (
        <>
          <div className="flex flex-col xl:grid xl:grid-cols-2 gap-4 lg:gap-6">
            <div className="order-1">
              <MetricsComparison
                baselineRoute={baselineRoute}
                optimizedRoute={optimizedRoute}
                alternativeRoutes={alternativeRoutes}
                llmExplanation={llmExplanation}
                isTrialUser={subscription.tier === 'trial'}
                selectedRoute={selectedRoute}
                onSelectedRouteChange={setSelectedRoute}
              />
            </div>
            <div className="order-2">
              <JSONOutputPanel response={apiResponse} apiKey={apiKey || undefined} />
            </div>
          </div>

          {/* AI Route Analysis - Mobile Optimized */}
          <div className="mt-4 lg:mt-6 p-4 lg:p-6 border rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border-blue-200 dark:border-blue-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-blue-900 dark:text-blue-100">AI Route Analysis</h3>
              </div>
              <div className="flex items-center gap-2">
                {isInsightsLoading && (
                  <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="text-xs">Analyzing...</span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowInsights(!showInsights)}
                  className="border-blue-300 text-blue-700 hover:bg-blue-100 dark:border-blue-600 dark:text-blue-300 dark:hover:bg-blue-900/50 text-sm"
                >
                  {showInsights ? 'Hide' : 'Show'} Insights
                </Button>
              </div>
            </div>
            {showInsights && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {llmExplanation ? (
                  <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-4 border border-blue-200/50 dark:border-blue-700/50">
                    <ReactMarkdown 
                      components={{
                        h1: ({children}) => <h1 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-3 border-b border-blue-200 dark:border-blue-700 pb-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mt-4 mb-2">{children}</h2>,
                        h3: ({children}) => <h3 className="text-md font-medium text-blue-700 dark:text-blue-300 mt-3 mb-2">{children}</h3>,
                        ul: ({children}) => <ul className="space-y-1 ml-4">{children}</ul>,
                        li: ({children}) => <li className="text-gray-700 dark:text-gray-300 flex items-start gap-2"><span className="text-blue-500 mt-1">•</span><span>{children}</span></li>,
                        p: ({children}) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold text-blue-900 dark:text-blue-100">{children}</strong>
                      }}
                    >
                      {llmExplanation}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-blue-600 dark:text-blue-400 mb-2">
                      <svg className="w-8 h-8 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-blue-600 dark:text-blue-400">AI insights will appear here after route optimization</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Route Context - Mobile Optimized */}
          <div className="mt-4 p-4 lg:p-6 border rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border-green-200 dark:border-green-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg flex-shrink-0">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-green-900 dark:text-green-100">Route Context</h3>
              </div>
              <div className="flex items-center gap-2">
                {isContextLoading && (
                  <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                    <span className="text-xs">Loading...</span>
                  </div>
                )}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setShowContext(!showContext)}
                  className="border-green-300 text-green-700 hover:bg-green-100 dark:border-green-600 dark:text-green-300 dark:hover:bg-green-900/50 text-sm"
                >
                  {showContext ? 'Hide' : 'Show'} Context
                </Button>
              </div>
            </div>
            {showContext && (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                {llmContextMarkdown ? (
                  <div className="bg-white/70 dark:bg-gray-900/70 rounded-lg p-4 border border-green-200/50 dark:border-green-700/50">
                    <ReactMarkdown 
                      components={{
                        h1: ({children}) => <h1 className="text-xl font-bold text-green-900 dark:text-green-100 mb-3 border-b border-green-200 dark:border-green-700 pb-2">{children}</h1>,
                        h2: ({children}) => <h2 className="text-lg font-semibold text-green-800 dark:text-green-200 mt-4 mb-2">{children}</h2>,
                        h3: ({children}) => <h3 className="text-md font-medium text-green-700 dark:text-green-300 mt-3 mb-2">{children}</h3>,
                        ul: ({children}) => <ul className="space-y-1 ml-4">{children}</ul>,
                        li: ({children}) => <li className="text-gray-700 dark:text-gray-300 flex items-start gap-2"><span className="text-green-500 mt-1">•</span><span>{children}</span></li>,
                        p: ({children}) => <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{children}</p>,
                        strong: ({children}) => <strong className="font-semibold text-green-900 dark:text-green-100">{children}</strong>
                      }}
                    >
                      {llmContextMarkdown}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="text-green-600 dark:text-green-400 mb-2">
                      <svg className="w-8 h-8 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <p className="text-sm text-green-600 dark:text-green-400">Traffic and amenities context will appear here</p>
                  </div>
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