/**
 * RouteInputPanel Component
 * Input form for route parameters and optimization settings
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Plus, Minus, MapPin, Loader2 } from 'lucide-react';
import { LatLng } from './InteractiveMap';

export interface OptimizationParameters {
  vehicleType: 'car' | 'truck' | 'van' | 'motorcycle';
  optimizeFor: 'distance' | 'time' | 'cost';
  avoidTolls: boolean;
  avoidTraffic: boolean;
}

export interface SubscriptionData {
  tier: 'trial' | 'starter' | 'professional' | 'enterprise';
  requests_remaining: number;
  monthly_requests_included: number;
  trial_end_date?: string;
}

export interface RouteInputPanelProps {
  origin: LatLng | null;
  destination: LatLng | null;
  waypoints: LatLng[];
  parameters: OptimizationParameters;
  subscription: SubscriptionData;
  isOptimizing: boolean;
  onOriginChange: (latlng: LatLng | null) => void;
  onDestinationChange: (latlng: LatLng | null) => void;
  onAddWaypoint: () => void;
  onRemoveWaypoint: (index: number) => void;
  onParametersChange: (params: Partial<OptimizationParameters>) => void;
  onOptimize: () => void;
}

export function RouteInputPanel({
  origin,
  destination,
  waypoints,
  parameters,
  subscription,
  isOptimizing,
  onOriginChange,
  onDestinationChange,
  onAddWaypoint,
  onRemoveWaypoint,
  onParametersChange,
  onOptimize,
}: RouteInputPanelProps) {
  const isTrialUser = subscription.tier === 'trial';
  const canAddWaypoints = !isTrialUser || waypoints.length < 3;
  const canUseGNN = !isTrialUser;
  const canUseAdvancedVehicles = !isTrialUser;

  const formatCoordinate = (latlng: LatLng | null) => {
    if (!latlng) return '';
    return `${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}`;
  };

  const parseCoordinate = (value: string): LatLng | null => {
    const parts = value.split(',').map(p => p.trim());
    if (parts.length !== 2) return null;
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (isNaN(lat) || isNaN(lng)) return null;
    return { lat, lng };
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Route Optimizer
          </CardTitle>
        </div>
        {isTrialUser && (
          <Badge variant="secondary" className="w-fit mt-2">
            Trial: {subscription.requests_remaining} requests left
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Origin Input */}
        <div className="space-y-2">
          <Label htmlFor="origin">Origin</Label>
          <div className="flex gap-2">
            <Input
              id="origin"
              placeholder="Click map or enter lat, lng"
              value={formatCoordinate(origin)}
              onChange={(e) => {
                const coord = parseCoordinate(e.target.value);
                onOriginChange(coord);
              }}
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => onOriginChange(null)}
              disabled={!origin}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Destination Input */}
        <div className="space-y-2">
          <Label htmlFor="destination">Destination</Label>
          <div className="flex gap-2">
            <Input
              id="destination"
              placeholder="Click map or enter lat, lng"
              value={formatCoordinate(destination)}
              onChange={(e) => {
                const coord = parseCoordinate(e.target.value);
                onDestinationChange(coord);
              }}
            />
            <Button
              size="icon"
              variant="outline"
              onClick={() => onDestinationChange(null)}
              disabled={!destination}
            >
              <MapPin className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Waypoints */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label>Waypoints ({waypoints.length})</Label>
            <Button
              size="sm"
              variant="outline"
              onClick={onAddWaypoint}
              disabled={!canAddWaypoints}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {!canAddWaypoints && (
            <Badge variant="secondary" className="text-xs w-full justify-center">
              Trial: Max 3 stops. Upgrade for unlimited.
            </Badge>
          )}
          {waypoints.map((waypoint, index) => (
            <div key={index} className="flex gap-2 items-center">
              <Input
                size="sm"
                value={formatCoordinate(waypoint)}
                readOnly
                className="text-sm"
              />
              <Button
                size="icon"
                variant="outline"
                onClick={() => onRemoveWaypoint(index)}
              >
                <Minus className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        {/* Vehicle Type */}
        <div className="space-y-2">
          <Label>Vehicle Type</Label>
          <Select
            value={parameters.vehicleType}
            onValueChange={(value) =>
              onParametersChange({ vehicleType: value as OptimizationParameters['vehicleType'] })
            }
            disabled={!canUseAdvancedVehicles && parameters.vehicleType !== 'car'}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="car">Car</SelectItem>
              {canUseAdvancedVehicles ? (
                <>
                  <SelectItem value="truck">Truck</SelectItem>
                  <SelectItem value="van">Van</SelectItem>
                  <SelectItem value="motorcycle">Motorcycle</SelectItem>
                </>
              ) : (
                <SelectItem value="truck" disabled>
                  Truck (Upgrade Required)
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {!canUseAdvancedVehicles && (
            <Badge variant="secondary" className="text-xs w-full justify-center">
              Trial: Car only. Upgrade for all vehicle types.
            </Badge>
          )}
        </div>

        {/* Optimization Preference */}
        <div className="space-y-2">
          <Label>Optimize For</Label>
          <Select
            value={parameters.optimizeFor}
            onValueChange={(value) =>
              onParametersChange({ optimizeFor: value as OptimizationParameters['optimizeFor'] })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="distance">Shortest Distance</SelectItem>
              <SelectItem value="time">Fastest Time</SelectItem>
              <SelectItem value="cost">Lowest Cost</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Avoidance Options */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="avoid-tolls">Avoid Tolls</Label>
            <Switch
              id="avoid-tolls"
              checked={parameters.avoidTolls}
              onCheckedChange={(checked) =>
                onParametersChange({ avoidTolls: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="avoid-traffic">Avoid Traffic</Label>
            <Switch
              id="avoid-traffic"
              checked={parameters.avoidTraffic}
              onCheckedChange={(checked) =>
                onParametersChange({ avoidTraffic: checked })
              }
            />
          </div>
        </div>

        {/* Algorithm Badge */}
        <div className="pt-2">
          {canUseGNN ? (
            <Badge className="bg-green-600 text-white w-full justify-center">
              🧠 GNN-Enhanced Optimization
            </Badge>
          ) : (
            <div className="space-y-2">
              <Badge variant="secondary" className="w-full justify-center">
                🔧 A* Algorithm (Trial)
              </Badge>
              <p className="text-xs text-muted-foreground text-center">
                Upgrade to unlock GNN optimization for 20-30% better routes
              </p>
            </div>
          )}
        </div>

        {/* Optimize Button */}
        <Button
          className="w-full"
          onClick={onOptimize}
          disabled={!origin || !destination || isOptimizing}
        >
          {isOptimizing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Optimizing...
            </>
          ) : (
            'Optimize Route'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
