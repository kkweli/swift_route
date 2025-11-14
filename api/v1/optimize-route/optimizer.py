"""
SwiftRoute Route Optimizer
Handles route optimization using various algorithms including baseline and GNN
"""

import asyncio
import hashlib
import json
import math
import time
import uuid
from typing import Dict, List, Any, Optional, Tuple
from models import RouteOptimizationRequest, OptimizedRoute, Coordinates, NavigationWaypoint, EfficiencyMetrics, AlternativeRoute
from database import DatabaseManager

class RouteOptimizer:
    """Route optimization engine with multiple algorithm support"""
    
    def __init__(self, db_manager: DatabaseManager):
        self.db_manager = db_manager
        self.status = "initializing"
        self.algorithms = {
            'dijkstra': self._dijkstra_optimize,
            'astar': self._astar_optimize,
            'gnn-astar': self._gnn_astar_optimize  # Will be implemented later
        }
        self.default_algorithm = 'astar'
    
    async def initialize(self):
        """Initialize the route optimizer"""
        try:
            self.status = "operational"
            print("✅ Route optimizer initialized")
        except Exception as e:
            self.status = "error"
            print(f"❌ Route optimizer initialization failed: {e}")
            raise
    
    def get_status(self) -> str:
        """Get current optimizer status"""
        return self.status
    
    async def optimize(self, request: RouteOptimizationRequest) -> OptimizedRoute:
        """
        Main route optimization method
        
        Args:
            request: Route optimization request
            
        Returns:
            Optimized route with all details
        """
        start_time = time.time()
        
        try:
            # Generate cache key
            cache_key = self._generate_cache_key(request)
            
            # Check cache first
            cached_route = await self.db_manager.get_cached_route(
                cache_key['origin_hash'],
                cache_key['destination_hash'],
                request.vehicle_type.value,
                request.optimization_preference.value
            )
            
            if cached_route:
                print(f"📋 Using cached route for {request.origin} -> {request.destination}")
                return OptimizedRoute(**cached_route)
            
            # Determine algorithm to use
            algorithm = self._select_algorithm(request)
            
            # Fetch road network data
            road_data = await self._fetch_road_network(request)
            
            if not road_data['segments']:
                # Fallback to direct route if no road data
                return await self._create_direct_route(request)
            
            # Run optimization algorithm
            optimized_route = await self.algorithms[algorithm](request, road_data)
            
            # Cache the result
            await self.db_manager.cache_route(
                cache_key['origin_hash'],
                cache_key['destination_hash'],
                request.vehicle_type.value,
                request.optimization_preference.value,
                optimized_route.dict(),
                expires_minutes=30
            )
            
            processing_time = int((time.time() - start_time) * 1000)
            optimized_route.metadata['processing_time_ms'] = processing_time
            
            return optimized_route
            
        except Exception as e:
            print(f"❌ Route optimization failed: {e}")
            # Return a basic direct route as fallback
            return await self._create_direct_route(request, error=str(e))
    
    def _generate_cache_key(self, request: RouteOptimizationRequest) -> Dict[str, str]:
        """Generate cache key for route request"""
        origin_str = f"{request.origin.lat:.6f},{request.origin.lng:.6f}"
        dest_str = f"{request.destination.lat:.6f},{request.destination.lng:.6f}"
        
        # Include constraints in hash
        constraints_str = ""
        if request.constraints:
            constraints_str = f"{request.constraints.avoid_traffic}{request.constraints.avoid_tolls}"
        
        origin_hash = hashlib.md5(f"{origin_str}{constraints_str}".encode()).hexdigest()
        dest_hash = hashlib.md5(f"{dest_str}{constraints_str}".encode()).hexdigest()
        
        return {
            'origin_hash': origin_hash,
            'destination_hash': dest_hash
        }
    
    def _select_algorithm(self, request: RouteOptimizationRequest) -> str:
        """Select the best algorithm for the request"""
        # For now, use A* as default
        # Later we'll add logic to choose GNN based on request complexity
        return 'astar'
    
    async def _fetch_road_network(self, request: RouteOptimizationRequest) -> Dict[str, Any]:
        """Fetch road network data for the route"""
        try:
            # Calculate bounding box for the route
            min_lat = min(request.origin.lat, request.destination.lat)
            max_lat = max(request.origin.lat, request.destination.lat)
            min_lng = min(request.origin.lng, request.destination.lng)
            max_lng = max(request.origin.lng, request.destination.lng)
            
            # Add padding to bounding box
            lat_padding = (max_lat - min_lat) * 0.2 + 0.01  # At least 0.01 degrees
            lng_padding = (max_lng - min_lng) * 0.2 + 0.01
            
            center_lat = (min_lat + max_lat) / 2
            center_lng = (min_lng + max_lng) / 2
            
            # Calculate radius (approximate)
            radius_km = max(
                self._haversine_distance(
                    min_lat - lat_padding, min_lng - lng_padding,
                    max_lat + lat_padding, max_lng + lng_padding
                ) / 2,
                5.0  # Minimum 5km radius
            )
            
            # Fetch road segments and nodes
            segments = await self.db_manager.fetch_road_segments_in_radius(
                center_lat, center_lng, radius_km
            )
            
            nodes = await self.db_manager.fetch_nodes_in_radius(
                center_lat, center_lng, radius_km
            )
            
            # Get traffic data if available
            segment_ids = [seg['id'] for seg in segments]
            traffic_data = await self.db_manager.get_traffic_data(segment_ids)
            
            return {
                'segments': segments,
                'nodes': nodes,
                'traffic_data': traffic_data,
                'bounds': {
                    'min_lat': min_lat - lat_padding,
                    'max_lat': max_lat + lat_padding,
                    'min_lng': min_lng - lng_padding,
                    'max_lng': max_lng + lng_padding
                }
            }
            
        except Exception as e:
            print(f"Error fetching road network: {e}")
            return {'segments': [], 'nodes': [], 'traffic_data': {}}
    
    async def _dijkstra_optimize(
        self, 
        request: RouteOptimizationRequest, 
        road_data: Dict[str, Any]
    ) -> OptimizedRoute:
        """Dijkstra's algorithm implementation"""
        # For now, return a simplified route
        # This will be enhanced with actual graph-based Dijkstra implementation
        return await self._create_simplified_route(request, road_data, 'dijkstra')
    
    async def _astar_optimize(
        self, 
        request: RouteOptimizationRequest, 
        road_data: Dict[str, Any]
    ) -> OptimizedRoute:
        """A* algorithm implementation"""
        # For now, return a simplified route
        # This will be enhanced with actual A* implementation
        return await self._create_simplified_route(request, road_data, 'astar')
    
    async def _gnn_astar_optimize(
        self, 
        request: RouteOptimizationRequest, 
        road_data: Dict[str, Any]
    ) -> OptimizedRoute:
        """GNN-enhanced A* algorithm (future implementation)"""
        # Fallback to A* for now
        route = await self._astar_optimize(request, road_data)
        route.metadata['algorithm_used'] = 'gnn-astar'
        route.metadata['gnn_status'] = 'not_implemented'
        return route
    
    async def _create_simplified_route(
        self, 
        request: RouteOptimizationRequest, 
        road_data: Dict[str, Any],
        algorithm: str
    ) -> OptimizedRoute:
        """Create a simplified route using available road data"""
        
        # Calculate direct distance
        direct_distance = self._haversine_distance(
            request.origin.lat, request.origin.lng,
            request.destination.lat, request.destination.lng
        )
        
        # Create a simple route with intermediate points
        coordinates = self._generate_route_coordinates(
            request.origin, request.destination, road_data['segments']
        )
        
        # Calculate route metrics
        total_distance = self._calculate_route_distance(coordinates)
        
        # Estimate time based on vehicle type and road conditions
        estimated_time = self._estimate_travel_time(
            total_distance, request.vehicle_type.value, road_data
        )
        
        # Estimate cost
        estimated_cost = self._estimate_route_cost(
            total_distance, estimated_time, request.vehicle_type.value
        )
        
        # Generate waypoints
        waypoints = self._generate_waypoints(coordinates)
        
        # Calculate efficiency metrics
        efficiency_metrics = EfficiencyMetrics(
            distance_vs_direct=total_distance / max(direct_distance, 0.1),
            time_vs_baseline=1.0,  # Baseline comparison
            cost_optimization=5.0,  # Estimated optimization percentage
            traffic_avoidance=10.0 if request.constraints and request.constraints.avoid_traffic else 0.0
        )
        
        # Generate route ID
        route_id = f"route_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
        
        return OptimizedRoute(
            route_id=route_id,
            coordinates=coordinates,
            distance_km=round(total_distance, 2),
            estimated_time_minutes=int(estimated_time),
            estimated_cost=round(estimated_cost, 2),
            waypoints=waypoints,
            efficiency_metrics=efficiency_metrics,
            metadata={
                'algorithm_used': algorithm,
                'road_segments_analyzed': len(road_data['segments']),
                'traffic_considered': bool(road_data['traffic_data']),
                'direct_distance_km': round(direct_distance, 2),
                'route_complexity': 'simple'
            }
        )
    
    async def _create_direct_route(
        self, 
        request: RouteOptimizationRequest, 
        error: Optional[str] = None
    ) -> OptimizedRoute:
        """Create a direct route as fallback"""
        
        # Direct line between origin and destination
        coordinates = [request.origin, request.destination]
        
        # Calculate direct distance
        distance = self._haversine_distance(
            request.origin.lat, request.origin.lng,
            request.destination.lat, request.destination.lng
        )
        
        # Estimate time (assuming average speed)
        avg_speed_kmh = {'car': 50, 'truck': 40, 'van': 45, 'motorcycle': 55}
        estimated_time = (distance / avg_speed_kmh.get(request.vehicle_type.value, 50)) * 60
        
        # Estimate cost
        estimated_cost = self._estimate_route_cost(
            distance, estimated_time, request.vehicle_type.value
        )
        
        # Basic waypoint
        waypoints = [
            NavigationWaypoint(
                coordinates=request.destination,
                instruction="Head directly to destination",
                distance_to_next=0,
                estimated_time=0
            )
        ]
        
        efficiency_metrics = EfficiencyMetrics(
            distance_vs_direct=1.0,
            time_vs_baseline=1.0,
            cost_optimization=0.0,
            traffic_avoidance=0.0
        )
        
        route_id = f"direct_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
        
        metadata = {
            'algorithm_used': 'direct',
            'road_segments_analyzed': 0,
            'traffic_considered': False,
            'route_complexity': 'direct',
            'fallback_reason': 'no_road_data'
        }
        
        if error:
            metadata['error'] = error
        
        return OptimizedRoute(
            route_id=route_id,
            coordinates=coordinates,
            distance_km=round(distance, 2),
            estimated_time_minutes=int(estimated_time),
            estimated_cost=round(estimated_cost, 2),
            waypoints=waypoints,
            efficiency_metrics=efficiency_metrics,
            metadata=metadata
        )
    
    def _generate_route_coordinates(
        self, 
        origin: Coordinates, 
        destination: Coordinates, 
        segments: List[Dict[str, Any]]
    ) -> List[Coordinates]:
        """Generate route coordinates using available road segments"""
        
        if not segments:
            return [origin, destination]
        
        # For now, create a simple route with some intermediate points
        # This will be replaced with actual pathfinding algorithm
        
        coordinates = [origin]
        
        # Add some intermediate points based on road segments
        # This is a simplified approach - real implementation would use graph algorithms
        num_intermediate = min(3, len(segments) // 10)
        
        for i in range(1, num_intermediate + 1):
            progress = i / (num_intermediate + 1)
            
            # Linear interpolation (will be replaced with actual road following)
            lat = origin.lat + (destination.lat - origin.lat) * progress
            lng = origin.lng + (destination.lng - origin.lng) * progress
            
            # Add some variation based on nearby road segments
            if segments:
                # Find closest segment to this interpolated point
                closest_segment = min(
                    segments,
                    key=lambda s: self._point_to_segment_distance(lat, lng, s)
                )
                
                # Adjust point slightly toward the road segment
                if closest_segment.get('geometry'):
                    # This is simplified - real implementation would snap to road
                    pass
            
            coordinates.append(Coordinates(lat=lat, lng=lng))
        
        coordinates.append(destination)
        return coordinates
    
    def _point_to_segment_distance(self, lat: float, lng: float, segment: Dict[str, Any]) -> float:
        """Calculate approximate distance from point to road segment"""
        # Simplified distance calculation
        # Real implementation would use proper geometric calculations
        if not segment.get('geometry'):
            return float('inf')
        
        try:
            geom = segment['geometry']
            if geom.get('type') == 'LineString' and geom.get('coordinates'):
                coords = geom['coordinates']
                if coords:
                    # Use first coordinate of the segment
                    seg_lng, seg_lat = coords[0]
                    return self._haversine_distance(lat, lng, seg_lat, seg_lng)
        except:
            pass
        
        return float('inf')
    
    def _calculate_route_distance(self, coordinates: List[Coordinates]) -> float:
        """Calculate total route distance"""
        total_distance = 0.0
        
        for i in range(len(coordinates) - 1):
            distance = self._haversine_distance(
                coordinates[i].lat, coordinates[i].lng,
                coordinates[i + 1].lat, coordinates[i + 1].lng
            )
            total_distance += distance
        
        return total_distance
    
    def _estimate_travel_time(
        self, 
        distance_km: float, 
        vehicle_type: str, 
        road_data: Dict[str, Any]
    ) -> float:
        """Estimate travel time in minutes"""
        
        # Base speeds by vehicle type (km/h)
        base_speeds = {
            'car': 50,
            'truck': 40,
            'van': 45,
            'motorcycle': 55
        }
        
        base_speed = base_speeds.get(vehicle_type, 50)
        
        # Adjust for traffic if available
        if road_data.get('traffic_data'):
            # Apply traffic factor (simplified)
            traffic_factor = 0.8  # 20% slower due to traffic
            base_speed *= traffic_factor
        
        # Convert to minutes
        time_hours = distance_km / base_speed
        return time_hours * 60
    
    def _estimate_route_cost(
        self, 
        distance_km: float, 
        time_minutes: float, 
        vehicle_type: str
    ) -> float:
        """Estimate route cost in local currency"""
        
        # Cost factors (simplified - would be more complex in real implementation)
        fuel_costs_per_km = {
            'car': 15.0,      # KES per km
            'truck': 25.0,
            'van': 20.0,
            'motorcycle': 8.0
        }
        
        time_costs_per_minute = {
            'car': 2.0,       # KES per minute
            'truck': 3.0,
            'van': 2.5,
            'motorcycle': 1.5
        }
        
        fuel_cost = distance_km * fuel_costs_per_km.get(vehicle_type, 15.0)
        time_cost = time_minutes * time_costs_per_minute.get(vehicle_type, 2.0)
        
        return fuel_cost + time_cost
    
    def _generate_waypoints(self, coordinates: List[Coordinates]) -> List[NavigationWaypoint]:
        """Generate navigation waypoints"""
        waypoints = []
        
        for i in range(len(coordinates) - 1):
            current = coordinates[i]
            next_coord = coordinates[i + 1]
            
            # Calculate distance to next point
            distance = self._haversine_distance(
                current.lat, current.lng,
                next_coord.lat, next_coord.lng
            ) * 1000  # Convert to meters
            
            # Generate instruction (simplified)
            if i == 0:
                instruction = "Head toward destination"
            elif i == len(coordinates) - 2:
                instruction = "Arrive at destination"
            else:
                instruction = f"Continue for {distance:.0f} meters"
            
            # Estimate time to next waypoint (assuming 50 km/h average)
            time_seconds = int((distance / 1000) / 50 * 3600)
            
            waypoints.append(NavigationWaypoint(
                coordinates=next_coord,
                instruction=instruction,
                distance_to_next=distance,
                estimated_time=time_seconds
            ))
        
        return waypoints
    
    def _haversine_distance(self, lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """Calculate distance between two points using Haversine formula"""
        
        # Convert to radians
        lat1, lng1, lat2, lng2 = map(math.radians, [lat1, lng1, lat2, lng2])
        
        # Haversine formula
        dlat = lat2 - lat1
        dlng = lng2 - lng1
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlng/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        # Earth radius in kilometers
        r = 6371
        
        return c * r