/**
 * Example Routes for Demonstration
 * Pre-configured routes showcasing different use cases
 */

import { LatLng } from '@/components/InteractiveMap';
import { OptimizationParameters } from '@/components/RouteInputPanel';

export interface ExampleRoute {
  id: string;
  name: string;
  description: string;
  industry: string;
  origin: LatLng;
  destination: LatLng;
  waypoints: LatLng[];
  parameters: OptimizationParameters;
}

export const EXAMPLE_ROUTES: ExampleRoute[] = [
  {
    id: 'delivery-nairobi-cbd',
    name: 'Nairobi CBD Delivery',
    description: 'Multi-stop delivery route in Nairobi Central Business District',
    industry: 'Last-Mile Delivery',
    origin: { lat: -1.2864, lng: 36.8172 }, // Kenyatta Avenue
    destination: { lat: -1.2921, lng: 36.8219 }, // Uhuru Park
    waypoints: [
      { lat: -1.2833, lng: 36.8167 }, // City Market
      { lat: -1.2895, lng: 36.8195 }, // KICC
    ],
    parameters: {
      vehicleType: 'van',
      optimizeFor: 'time',
      avoidTolls: false,
      avoidTraffic: true,
    },
  },
  {
    id: 'field-service-westlands',
    name: 'Westlands Field Service',
    description: 'Service technician route across Westlands to Kilimani',
    industry: 'Field Service',
    origin: { lat: -1.2630, lng: 36.8063 }, // Westlands
    destination: { lat: -1.2979, lng: 36.7828 }, // Kilimani
    waypoints: [
      { lat: -1.2707, lng: 36.8029 }, // Parklands
      { lat: -1.2884, lng: 36.7923 }, // Lavington
    ],
    parameters: {
      vehicleType: 'car',
      optimizeFor: 'distance',
      avoidTolls: true,
      avoidTraffic: true,
    },
  },
  {
    id: 'emergency-nairobi',
    name: 'Nairobi Emergency Response',
    description: 'Emergency vehicle route from hospital to incident',
    industry: 'Emergency Services',
    origin: { lat: -1.3028, lng: 36.8070 }, // Kenyatta National Hospital
    destination: { lat: -1.2195, lng: 36.8858 }, // Ruaraka
    waypoints: [
      { lat: -1.2641, lng: 36.8472 }, // Pangani
    ],
    parameters: {
      vehicleType: 'car',
      optimizeFor: 'time',
      avoidTolls: false,
      avoidTraffic: true,
    },
  },
  {
    id: 'logistics-industrial-area',
    name: 'Industrial Area Logistics',
    description: 'Freight delivery through Nairobi Industrial Area',
    industry: 'Freight & Logistics',
    origin: { lat: -1.3197, lng: 36.8517 }, // Industrial Area
    destination: { lat: -1.2921, lng: 36.8219 }, // CBD
    waypoints: [
      { lat: -1.3073, lng: 36.8394 }, // Imara Daima
      { lat: -1.3000, lng: 36.8300 }, // South B
    ],
    parameters: {
      vehicleType: 'truck',
      optimizeFor: 'cost',
      avoidTolls: true,
      avoidTraffic: false,
    },
  },
];

/**
 * Get example route by ID
 */
export function getExampleRoute(id: string): ExampleRoute | undefined {
  return EXAMPLE_ROUTES.find((route) => route.id === id);
}

/**
 * Get all example routes
 */
export function getAllExampleRoutes(): ExampleRoute[] {
  return EXAMPLE_ROUTES;
}
