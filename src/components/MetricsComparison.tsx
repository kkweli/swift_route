/**
 * MetricsComparison Component
 * Side-by-side comparison of baseline vs optimized route metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { TrendingDown, Clock, DollarSign, Leaf, Route, Zap, ArrowRight, BrainCircuit } from 'lucide-react';
import { RouteResult } from '@/lib/route-api';
import { useNavigate } from 'react-router-dom';

interface RouteAnalysis {
  label: string;
  summary: string;
  suggestion?: string;
  confidence_score?: number;
}

interface LogisticsInsights {
  route_summary?: string;
  operational_advantages?: string[];
  operational_challenges?: string[];
  weather_recommendations?: string;
  infrastructure_reliability?: string;
  logistics_cost_implications?: string;
}

interface RouteLogisticsAnalysis {
  label?: string;
  summary?: string;
  logistics_insights?: LogisticsInsights;
  suggestion?: string;
  confidence_score?: number;
}

export interface MetricsComparisonProps {
  baselineRoute: RouteResult | null;
  optimizedRoute: RouteResult | null;
  alternativeRoutes: RouteResult[];
  llmExplanation: {
    routes?: RouteLogisticsAnalysis[];
    note?: string;
    used_llm?: boolean;
    weather_readiness_assessment?: string;
    infrastructure_quality_rating?: string;
    driver_comfort_safety_index?: number;
    emergency_preparedness_score?: number;
    overall_logistics_suitability_rating?: string;
    timestamp?: string;
  } | string | null;
  isTrialUser: boolean;
  selectedRoute: 'baseline' | 'optimized' | 'alternative-0' | 'alternative-1' | null;
  onSelectedRouteChange: (route: 'baseline' | 'optimized' | 'alternative-0' | 'alternative-1') => void;
}

export function MetricsComparison({
  baselineRoute,
  optimizedRoute,
  alternativeRoutes,
  llmExplanation,
  isTrialUser,
  selectedRoute,
  onSelectedRouteChange,
}: MetricsComparisonProps) {
  const navigate = useNavigate();

  if (!baselineRoute || !optimizedRoute) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Route Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            Optimize a route to see comparison metrics
          </p>
        </CardContent>
      </Card>
    );
  }



  const distanceImprovement =
    ((baselineRoute.distance - optimizedRoute.distance) / baselineRoute.distance) * 100;
  const timeImprovement =
    ((baselineRoute.estimated_time - optimizedRoute.estimated_time) /
      baselineRoute.estimated_time) *
    100;
  const costSavings = baselineRoute.cost - optimizedRoute.cost;
  const co2Savings = baselineRoute.co2_emissions - optimizedRoute.co2_emissions;

  const metrics = [
    {
      icon: Route,
      label: 'Distance',
      baseline: `${baselineRoute.distance.toFixed(1)} km`,
      optimized: `${optimizedRoute.distance.toFixed(1)} km`,
      improvement: distanceImprovement,
      unit: '%',
      color: 'text-blue-600',
    },
    {
      icon: Clock,
      label: 'Time',
      baseline: `${Math.round(baselineRoute.estimated_time)} min`,
      optimized: `${Math.round(optimizedRoute.estimated_time)} min`,
      improvement: timeImprovement,
      unit: '%',
      color: 'text-purple-600',
    },
    {
      icon: DollarSign,
      label: 'Cost',
      baseline: `$${baselineRoute.cost.toFixed(2)}`,
      optimized: `$${optimizedRoute.cost.toFixed(2)}`,
      improvement: costSavings,
      unit: '$',
      color: 'text-green-600',
    },
    {
      icon: Leaf,
      label: 'CO₂ Emissions',
      baseline: `${baselineRoute.co2_emissions.toFixed(2)} kg`,
      optimized: `${optimizedRoute.co2_emissions.toFixed(2)} kg`,
      improvement: co2Savings,
      unit: 'kg',
      color: 'text-green-600',
    },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Route Comparison</CardTitle>
          <div className="flex gap-2">
            <Badge variant="secondary">
              {baselineRoute.algorithm_used.toUpperCase()}
            </Badge>
            <Badge className="bg-green-600 text-white">
              {optimizedRoute.algorithm_used.toUpperCase()}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Route Selector */}
          <RadioGroup
            value={selectedRoute ?? 'optimized'}
            onValueChange={onSelectedRouteChange}
            className="grid grid-cols-2 lg:grid-cols-4 gap-2"
          >
            <Label htmlFor="r-optimized" className={`flex flex-col items-center justify-center rounded-md border-2 p-3 hover:bg-accent hover:text-accent-foreground ${selectedRoute === 'optimized' ? 'border-primary' : ''}`}>
              <RadioGroupItem value="optimized" id="r-optimized" className="sr-only" />
              <div className="font-semibold">Optimized</div>
              <div className="text-xs text-muted-foreground">{optimizedRoute.distance.toFixed(1)} km / {optimizedRoute.estimated_time.toFixed(1)} min</div>
            </Label>
            <Label htmlFor="r-baseline" className={`flex flex-col items-center justify-center rounded-md border-2 p-3 hover:bg-accent hover:text-accent-foreground ${selectedRoute === 'baseline' ? 'border-primary' : ''}`}>
              <RadioGroupItem value="baseline" id="r-baseline" className="sr-only" />
              <div className="font-semibold">Baseline</div>
              <div className="text-xs text-muted-foreground">{baselineRoute.distance.toFixed(1)} km / {baselineRoute.estimated_time.toFixed(1)} min</div>
            </Label>
            {alternativeRoutes.map((route, index) => (
              <Label key={`r-alt-${index}`} htmlFor={`r-alt-${index}`} className={`flex flex-col items-center justify-center rounded-md border-2 p-3 hover:bg-accent hover:text-accent-foreground ${selectedRoute === `alternative-${index}` ? 'border-primary' : ''}`}>
                <RadioGroupItem value={`alternative-${index}`} id={`r-alt-${index}`} className="sr-only" />
                <div className="font-semibold">Alternative {index + 1}</div>
                <div className="text-xs text-muted-foreground">{route.distance.toFixed(1)} km / {route.estimated_time.toFixed(1)} min</div>
              </Label>
            ))}
          </RadioGroup>

          {/* LLM Explanation */}
          {llmExplanation && (
            <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-2 mb-2">
                <BrainCircuit className="h-5 w-5 text-blue-600" />
                <span className="font-semibold text-blue-900 dark:text-blue-100">
                  AI Route Analysis
                </span>
              </div>
              <div className="text-sm text-blue-700 dark:text-blue-300 space-y-3">
                {llmExplanation && typeof llmExplanation === 'object' ? (
                  <>
                    {llmExplanation.routes && Array.isArray(llmExplanation.routes) && llmExplanation.routes.map((route: RouteLogisticsAnalysis, index: number) => (
                      <div key={index} className="bg-white/50 dark:bg-gray-800/50 rounded p-3 mb-3">
                        <div className="font-semibold text-blue-900 dark:text-blue-100 mb-2">{route.label}</div>

                        {route.logistics_insights?.route_summary && (
                          <div className="mb-2">
                            <div className="font-medium text-xs text-blue-800 dark:text-blue-200 uppercase tracking-wide mb-1">Route Summary</div>
                            <p className="text-sm">{route.logistics_insights.route_summary}</p>
                          </div>
                        )}

                        {route.logistics_insights?.operational_advantages && route.logistics_insights.operational_advantages.length > 0 && (
                          <div className="mb-2">
                            <div className="font-medium text-xs text-green-700 dark:text-green-300 uppercase tracking-wide mb-1">Top Advantages</div>
                            <ul className="text-sm space-y-1">
                              {route.logistics_insights.operational_advantages.slice(0, 3).map((advantage: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-green-500 mt-0.5">✓</span>
                                  <span className="leading-snug">{advantage}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {route.logistics_insights?.operational_challenges && route.logistics_insights.operational_challenges.length > 0 && (
                          <div className="mb-2">
                            <div className="font-medium text-xs text-orange-700 dark:text-orange-300 uppercase tracking-wide mb-1">Key Challenges</div>
                            <ul className="text-sm space-y-1">
                              {route.logistics_insights.operational_challenges.slice(0, 3).map((challenge: string, idx: number) => (
                                <li key={idx} className="flex items-start gap-1">
                                  <span className="text-orange-500 mt-0.5">⚠</span>
                                  <span className="leading-snug">{challenge}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                          {route.logistics_insights?.weather_recommendations && (
                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                              <div className="font-medium text-xs text-blue-800 dark:text-blue-200 uppercase tracking-wide mb-1">Weather Notes</div>
                              <p className="text-xs">{route.logistics_insights.weather_recommendations}</p>
                            </div>
                          )}

                          {route.logistics_insights?.infrastructure_reliability && (
                            <div className="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                              <div className="font-medium text-xs text-purple-800 dark:text-purple-200 uppercase tracking-wide mb-1">Infrastructure</div>
                              <p className="text-xs">{route.logistics_insights.infrastructure_reliability}</p>
                            </div>
                          )}
                        </div>

                        {route.logistics_insights?.logistics_cost_implications && (
                          <div className="mt-2 bg-gray-50 dark:bg-gray-800/50 rounded p-2">
                            <div className="font-medium text-xs text-gray-800 dark:text-gray-200 uppercase tracking-wide mb-1">Cost Implications</div>
                            <p className="text-xs">{route.logistics_insights.logistics_cost_implications}</p>
                          </div>
                        )}

                        {route.summary && (
                          <div className="mt-2 pt-2 border-t border-blue-200 text-xs opacity-90">
                            {route.summary}
                          </div>
                        )}
                      </div>
                    ))}

                    <div className="mt-4 pt-3 border-t border-blue-300">
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-center">
                        {llmExplanation.weather_readiness_assessment && (
                          <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
                            <div className="font-medium text-xs text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-1">Weather Ready</div>
                            <Badge variant={llmExplanation.weather_readiness_assessment === 'Excellent' ? 'default' : llmExplanation.weather_readiness_assessment === 'Good' ? 'secondary' : 'destructive'}>
                              {llmExplanation.weather_readiness_assessment}
                            </Badge>
                          </div>
                        )}

                        {llmExplanation.infrastructure_quality_rating && (
                          <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
                            <div className="font-medium text-xs text-purple-700 dark:text-purple-300 uppercase tracking-wide mb-1">Infrastructure</div>
                            <Badge variant={llmExplanation.infrastructure_quality_rating === 'Excellent' ? 'default' : llmExplanation.infrastructure_quality_rating === 'Good' ? 'secondary' : 'destructive'}>
                              {llmExplanation.infrastructure_quality_rating}
                            </Badge>
                          </div>
                        )}

                        {llmExplanation.driver_comfort_safety_index !== undefined && (
                          <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
                            <div className="font-medium text-xs text-green-700 dark:text-green-300 uppercase tracking-wide mb-1">Driver Safety</div>
                            <div className="text-lg font-bold text-green-600 dark:text-green-400">
                              {llmExplanation.driver_comfort_safety_index}/100
                            </div>
                          </div>
                        )}

                        {llmExplanation.emergency_preparedness_score !== undefined && (
                          <div className="bg-white/50 dark:bg-gray-800/50 rounded p-2">
                            <div className="font-medium text-xs text-red-700 dark:text-red-300 uppercase tracking-wide mb-1">Emergency Ready</div>
                            <div className="text-lg font-bold text-red-600 dark:text-red-400">
                              {llmExplanation.emergency_preparedness_score}/100
                            </div>
                          </div>
                        )}
                      </div>

                      {llmExplanation.overall_logistics_suitability_rating && (
                        <div className="mt-3 flex justify-center">
                          <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/20 dark:to-green-900/20 rounded-lg px-4 py-2 border border-blue-200 dark:border-blue-700">
                            <div className="text-center">
                              <div className="text-sm font-medium text-gray-800 dark:text-gray-200 mb-1">
                                Overall Logistics Suitability
                              </div>
                              <Badge
                                variant="outline"
                                className={`text-lg px-4 py-1 ${
                                  llmExplanation.overall_logistics_suitability_rating === 'Excellent'
                                    ? 'border-green-500 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20'
                                    : llmExplanation.overall_logistics_suitability_rating === 'Good'
                                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                                    : 'border-orange-500 text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20'
                                }`}
                              >
                                {llmExplanation.overall_logistics_suitability_rating}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {llmExplanation.note && (
                      <div className="mt-4 text-xs text-center text-blue-600 dark:text-blue-400 italic border-t border-blue-200 pt-2">
                        {llmExplanation.note}
                      </div>
                    )}
                  </>
                ) : (
                  <p>{typeof llmExplanation === 'string' ? llmExplanation : JSON.stringify(llmExplanation)}</p>
                )}
              </div>
            </div>
          )}

          {/* Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.map((metric, index) => {
              const Icon = metric.icon;
              const isImprovement = metric.improvement > 0;

              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${metric.color}`} />
                    <span className="font-medium">{metric.label}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded">
                      <div className="text-xs text-muted-foreground mb-1">Baseline</div>
                      <div className="font-medium">{metric.baseline}</div>
                    </div>
                    <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded">
                      <div className="text-xs text-muted-foreground mb-1">Optimized</div>
                      <div className="font-medium">{metric.optimized}</div>
                    </div>
                  </div>
                  {isImprovement && (
                    <div className="flex items-center gap-1">
                      <TrendingDown className="h-3 w-3 text-green-600" />
                      <span className="text-sm text-green-600 font-medium">
                        {metric.unit === '%'
                          ? `${metric.improvement.toFixed(1)}% improvement`
                          : `${metric.improvement.toFixed(2)} ${metric.unit} saved`}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* SDG 11 Impact */}
        {co2Savings > 0 && (
          <div className="mt-6 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <div className="flex items-center gap-2 mb-2">
              <Leaf className="h-5 w-5 text-green-600" />
              <span className="font-semibold text-green-900 dark:text-green-100">
                Contributing to UN SDG 11.6
              </span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">
              This optimized route reduces CO₂ emissions by{' '}
              <strong>{co2Savings.toFixed(2)} kg</strong>, equivalent to planting{' '}
              <strong>{Math.ceil(co2Savings / 21.77)}</strong> tree seedlings.
            </p>
          </div>
        )}

        {/* Trial User Upgrade Prompt */}
        {isTrialUser && (
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                Unlock Better Results
              </span>
            </div>
            <p className="text-sm text-blue-700 dark:text-blue-300 mb-3">
              This route used {baselineRoute.algorithm_used.toUpperCase()} algorithm. Upgrade to
              unlock GNN optimization for 20-30% better performance.
            </p>
            <Button
              size="sm"
              className="w-full"
              onClick={() => navigate('/pricing')}
            >
              Upgrade Now
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        )}

        {/* Performance Stats */}
        <div className="mt-4 pt-4 border-t">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Processing Time:</span>
              <span className="ml-2 font-medium">
                {optimizedRoute.processing_time}ms
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Algorithm:</span>
              <span className="ml-2 font-medium">
                {optimizedRoute.algorithm_used.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
