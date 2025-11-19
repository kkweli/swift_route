/**
 * InteractiveMap Component
 * Leaflet-based map for route visualization and interaction
 */

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Leaflet with Webpack/Vite
const _proto = L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown; [key: string]: unknown };
// remove the legacy `_getIconUrl` if present so mergeOptions works correctly
delete _proto._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export interface LatLng {
  lat: number;
  lng: number;
}

export interface InteractiveMapProps {
  origin: LatLng | null;
  destination: LatLng | null;
  waypoints: LatLng[];
  baselineRoute: LatLng[] | null;
  optimizedRoute: LatLng[] | null;
  alternativeRoutes?: LatLng[][];
  onMapClick?: (latlng: LatLng) => void;
  selectedRoute?: 'baseline' | 'optimized' | 'alternative-0' | 'alternative-1' | null;
  center?: LatLng;
  zoom?: number;
}

// Custom marker icons
const createCustomIcon = (color: string, size: [number, number] = [25, 41]) => {
  return new L.Icon({
    iconUrl: `data:image/svg+xml;base64,${btoa(`
      <svg width="${size[0]}" height="${size[1]}" viewBox="0 0 ${size[0]} ${size[1]}" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M${size[0] / 2} 0C${size[0] / 2 - 6.904} 0 0 5.596 0 12.5C0 21.875 ${size[0] / 2} ${size[1]} ${size[0] / 2} ${size[1]}C${size[0] / 2} ${size[1]} ${size[0]} 21.875 ${size[0]} 12.5C${size[0]} 5.596 ${size[0] / 2 + 6.904} 0 ${size[0] / 2} 0Z" fill="${color}"/>
        <circle cx="${size[0] / 2}" cy="12.5" r="5" fill="white"/>
      </svg>
    `)}`,
    iconSize: size,
    iconAnchor: [size[0] / 2, size[1]],
    popupAnchor: [0, -size[1]],
  });
};

const originIcon = createCustomIcon('#10B981'); // Green
const destinationIcon = createCustomIcon('#EF4444'); // Red
const waypointIcon = new L.Icon({
  iconUrl: `data:image/svg+xml;base64,${btoa(`
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="10" cy="10" r="10" fill="#3B82F6"/>
      <circle cx="10" cy="10" r="4" fill="white"/>
    </svg>
  `)}`,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
  popupAnchor: [0, -10],
});

// Map click handler component
function MapClickHandler({ onClick }: { onClick?: (latlng: LatLng) => void }) {
  useMapEvents({
    click: (e) => {
      if (onClick) {
        onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

export function InteractiveMap({
  origin,
  destination,
  waypoints = [],
  baselineRoute,
  optimizedRoute,
  alternativeRoutes = [],
  onMapClick,
  selectedRoute = null,
  center = { lat: -1.2921, lng: 36.8219 }, // Default to Nairobi, Kenya
  zoom = 10,
}: InteractiveMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  // Debug: log rendering data
  console.log('🗺️ InteractiveMap Props:', {
    hasOrigin: !!origin,
    hasDestination: !!destination,
    waypointsCount: waypoints.length,
    baselineRouteCount: baselineRoute?.length,
    optimizedRouteCount: optimizedRoute?.length,
    alternativeRoutesCount: alternativeRoutes.length,
    selectedRoute,
  });

  // Auto-fit bounds when routes change
  useEffect(() => {
    if (mapRef.current && (baselineRoute || optimizedRoute)) {
      const bounds = L.latLngBounds([]);
      
      if (origin) bounds.extend([origin.lat, origin.lng]);
      if (destination) bounds.extend([destination.lat, destination.lng]);
      waypoints.forEach(wp => bounds.extend([wp.lat, wp.lng]));
      
      if (baselineRoute) {
        baselineRoute.forEach(point => bounds.extend([point.lat, point.lng]));
      }
      if (optimizedRoute) {
        optimizedRoute.forEach(point => bounds.extend([point.lat, point.lng]));
      }
      
      if (bounds.isValid()) {
        mapRef.current.fitBounds(bounds, { padding: [50, 50] });
      }
    }
  }, [origin, destination, waypoints, baselineRoute, optimizedRoute]);

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        style={{ height: '100%', width: '100%', minHeight: '500px' }}
        className="rounded-lg shadow-md"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {/* Map click handler */}
        <MapClickHandler onClick={onMapClick} />

        {/* Origin marker */}
        {origin && (
          <Marker position={[origin.lat, origin.lng]} icon={originIcon}>
            <Popup>
              <div className="text-sm">
                <strong>Origin</strong>
                <br />
                {origin.lat.toFixed(4)}, {origin.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Destination marker */}
        {destination && (
          <Marker position={[destination.lat, destination.lng]} icon={destinationIcon}>
            <Popup>
              <div className="text-sm">
                <strong>Destination</strong>
                <br />
                {destination.lat.toFixed(4)}, {destination.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        )}

        {/* Waypoint markers */}
        {waypoints.map((waypoint, index) => (
          <Marker
            key={`waypoint-${index}`}
            position={[waypoint.lat, waypoint.lng]}
            icon={waypointIcon}
          >
            <Popup>
              <div className="text-sm">
                <strong>Waypoint {index + 1}</strong>
                <br />
                {waypoint.lat.toFixed(4)}, {waypoint.lng.toFixed(4)}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Baseline route - always visible with dashed line */}
        {baselineRoute && baselineRoute.length > 0 && (
          <Polyline
            positions={baselineRoute.map(p => [p.lat, p.lng])}
            color={selectedRoute === 'baseline' ? '#374151' : '#6B7280'}
            weight={selectedRoute === 'baseline' ? 6 : 4}
            opacity={0.8}
            dashArray="8, 8"
            pathOptions={{
              className: selectedRoute === 'baseline' ? 'selected-route-pulse' : ''
            }}
          />
        )}

        {/* Optimized route - always visible with solid line */}
        {optimizedRoute && optimizedRoute.length > 0 && (
          <Polyline
            positions={optimizedRoute.map(p => [p.lat, p.lng])}
            color={selectedRoute === 'optimized' ? '#059669' : '#10B981'}
            weight={selectedRoute === 'optimized' ? 6 : 4}
            opacity={0.9}
            pathOptions={{
              className: selectedRoute === 'optimized' ? 'selected-route-pulse' : ''
            }}
          />
        )}

        {/* Alternative routes */}
        {alternativeRoutes && alternativeRoutes.map((route, index) => (
          <Polyline
            key={`alt-${index}`}
            positions={route.map(p => [p.lat, p.lng])}
            color={selectedRoute === `alternative-${index}` ? (index === 0 ? '#1E40AF' : '#D97706') : (index === 0 ? '#93C5FD' : '#FCD34D')}
            weight={selectedRoute === `alternative-${index}` ? 8 : 3}
            opacity={selectedRoute === `alternative-${index}` ? 1 : 0.3}
            dashArray="5, 5"
            pathOptions={{
              className: selectedRoute === `alternative-${index}` ? 'selected-route-pulse' : ''
            }}
          />
        ))}
      </MapContainer>

      {/* Map legend */}
      {(baselineRoute || optimizedRoute) && (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-3 text-sm z-[1000]">
          <div className="font-semibold mb-2">Route Legend</div>
          {baselineRoute && (
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-1 bg-gray-500 border-dashed border-t-2 border-gray-500"></div>
              <span>Baseline Route</span>
            </div>
          )}
          {optimizedRoute && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-1 bg-green-500"></div>
              <span>Optimized Route</span>
            </div>
          )}
          {alternativeRoutes && alternativeRoutes.map((_, index) => (
            <div key={`legend-alt-${index}`} className="flex items-center gap-2 mt-1">
              <div
                className="w-8 h-1"
                style={{ backgroundColor: index === 0 ? '#3B82F6' : '#F59E0B', borderStyle: 'dashed', borderWidth: '2px 0' }}
              ></div>
              <span>Alternative {index + 1}</span>
            </div>
          ))}
        </div>
      )}

      {/* Click instruction overlay */}
      {!origin && onMapClick && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm z-[1000]">
          Click on the map to set origin
        </div>
      )}
      {origin && !destination && onMapClick && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-2 rounded-lg shadow-lg text-sm z-[1000]">
          Click on the map to set destination
        </div>
      )}
    </div>
  );
}
