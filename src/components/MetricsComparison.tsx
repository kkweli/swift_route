/**
 * MetricsComparison Component
 * Side-by-side comparison of baseline vs optimized route metrics
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingDown, Clock, DollarSign, Leaf, Route, Zap, ArrowRight } from 'lucide-react';
import { RouteResult } from '@/lib/route-api';
import { useNavigate } from 'react-router-dom';

export interface MetricsComparisonProps {
  baselineRoute: RouteResult | null;
  optimizedRoute: RouteResult | null;
  isTrialUser: boolean;
}

export function MetricsComparison({
  baselineRoute,
  optimizedRoute,
  isTrialUser,
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
