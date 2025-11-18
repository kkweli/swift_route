/**
 * TrafficAmenityInfo Component
 * Displays traffic conditions and amenity recommendations
 */

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  AlertTriangle, 
  Coffee, 
  Fuel, 
  Hospital, 
  MapPin, 
  ShoppingBag, 
  Utensils,
  Clock,
  Navigation
} from 'lucide-react';
import { TrafficInfo, Amenity } from '@/lib/route-api';

interface TrafficAmenityInfoProps {
  trafficInfo?: TrafficInfo;
  amenities?: Amenity[];
}

export function TrafficAmenityInfo({ trafficInfo, amenities }: TrafficAmenityInfoProps) {
  if (!trafficInfo && (!amenities || amenities.length === 0)) {
    return null;
  }

  const getTrafficColor = (level: number) => {
    if (level < 0.8) return 'bg-green-500';
    if (level < 1.2) return 'bg-yellow-500';
    if (level < 1.5) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getAmenityIcon = (type: string) => {
    switch (type) {
      case 'restaurant':
        return <Utensils className="h-4 w-4" />;
      case 'cafe':
        return <Coffee className="h-4 w-4" />;
      case 'gas_station':
        return <Fuel className="h-4 w-4" />;
      case 'hospital':
      case 'pharmacy':
        return <Hospital className="h-4 w-4" />;
      case 'supermarket':
        return <ShoppingBag className="h-4 w-4" />;
      default:
        return <MapPin className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'border-green-500 bg-green-50';
      case 'medium':
        return 'border-blue-500 bg-blue-50';
      default:
        return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className="space-y-4">
      {/* Traffic Information */}
      {trafficInfo && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Navigation className="h-5 w-5" />
              Traffic Conditions
            </CardTitle>
            <CardDescription>
              Current traffic analysis for your route
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Traffic Level */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getTrafficColor(trafficInfo.traffic_level)}`} />
                <div>
                  <p className="font-medium">{trafficInfo.traffic_description}</p>
                  <p className="text-sm text-muted-foreground">
                    {trafficInfo.area_type.charAt(0).toUpperCase() + trafficInfo.area_type.slice(1)} area
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Badge>
            </div>

            {/* Traffic Warning */}
            {trafficInfo.avoid_route && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Heavy traffic expected at this time. Consider alternative routes or delaying your trip.
                </AlertDescription>
              </Alert>
            )}

            {/* Traffic Multiplier Info */}
            <div className="text-xs text-muted-foreground">
              Traffic impact: {trafficInfo.traffic_level}x normal conditions
            </div>
          </CardContent>
        </Card>
      )}

      {/* Amenity Recommendations */}
      {amenities && amenities.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Amenities Along Route
            </CardTitle>
            <CardDescription>
              Recommended stops based on time of day and route duration
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {amenities
                .filter(a => a.priority === 'high' || a.priority === 'medium')
                .slice(0, 6)
                .map((amenity, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${getPriorityColor(amenity.priority)}`}
                  >
                    <div className="flex-shrink-0">
                      {getAmenityIcon(amenity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium capitalize">
                        {amenity.type.replace('_', ' ')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {amenity.reason}
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {amenity.priority}
                    </Badge>
                  </div>
                ))}
            </div>

            {amenities.length > 6 && (
              <p className="text-xs text-muted-foreground mt-3 text-center">
                +{amenities.length - 6} more amenities available
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
