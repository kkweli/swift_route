"""
Main route optimization engine
Coordinates all components for route optimization
"""
import time
from typing import List, Optional, Tuple, Dict
from dataclasses import dataclass, asdict

from ..network.loader import RoadNetworkLoader
from ..network.filters import VehicleNetworkFilter
from ..network.graph import GraphUtils
from ..models.vehicle import VehicleProfile
from .astar import AStarOptimizer, BidirectionalOptimizer, RouteResult
from ..utils.cache import get_cached_route, cache_route


@dataclass
class OptimizationRequest:
    """Route optimization request"""
    origin: Tuple[float, float]  # (lat, lng)
    destination: Tuple[float, float]
    vehicle_profile: VehicleProfile
    optimization_criteria: str = 'time'  # 'time', 'distance', 'cost', 'emissions'
    find_alternatives: bool = True
    num_alternatives: int = 2


@dataclass
class OptimizationResponse:
    """Route optimization response"""
    primary_route: RouteResult
    alternative_routes: List[RouteResult]
    baseline_route: Optional[RouteResult]  # Simple distance-based route
    improvements: Dict[str, float]
    metadata: Dict[str, any]


class RouteOptimizationEngine:
    """
    Main engine for route optimization
    Coordinates loading, filtering, and optimization
    """
    
    def __init__(self):
        """Initialize optimization engine"""
        self.loader = RoadNetworkLoader()
        self.optimizer = AStarOptimizer(max_execution_time_seconds=8)
        self.bidirectional = BidirectionalOptimizer()
    
    def optimize(self, request: OptimizationRequest) -> Optional[OptimizationResponse]:
        """
        Optimize route based on request
        
        Args:
            request: Optimization request
        
        Returns:
            OptimizationResponse or None if failed
        """
        start_time = time.time()
        
        try:
            # Check cache first
            cached = get_cached_route(
                origin=request.origin,
                destination=request.destination,
                vehicle_type=request.vehicle_profile.vehicle_type.value,
                optimization=request.optimization_criteria
            )
            
            if cached:
                print("✓ Using cached route")
                return cached
            
            # Load road network
            print("Loading road network...")
            graph = self.loader.build_graph()
            
            # Filter for vehicle
            print(f"Filtering for {request.vehicle_profile.vehicle_type.value}...")
            graph = VehicleNetworkFilter.filter_graph_by_vehicle(
                graph,
                request.vehicle_profile
            )
            
            # Prioritize truck routes if needed
            if request.vehicle_profile.requires_truck_route():
                graph = VehicleNetworkFilter.prioritize_truck_routes(
                    graph,
                    request.vehicle_profile
                )
            
            # Add weights based on optimization criteria
            print(f"Calculating weights for {request.optimization_criteria} optimization...")
            graph = self._add_optimization_weights(
                graph,
                request.optimization_criteria,
                request.vehicle_profile
            )
            
            # Find nearest nodes to origin and destination
            origin_node = self.loader.find_nearest_node(
                request.origin[0],
                request.origin[1],
                graph
            )
            dest_node = self.loader.find_nearest_node(
                request.destination[0],
                request.destination[1],
                graph
            )
            
            if not origin_node or not dest_node:
                print("✗ Could not find nodes near origin/destination")
                return None
            
            print(f"Optimizing route from {origin_node} to {dest_node}...")
            
            # Get baseline route (simple distance)
            baseline = self._get_baseline_route(graph, origin_node, dest_node)
            
            # Get optimized route
            primary = self.optimizer.optimize_route(
                graph,
                origin_node,
                dest_node,
                weight='weight'
            )
            
            if not primary:
                print("✗ No route found")
                return None
            
            # Get alternatives if requested
            alternatives = []
            if request.find_alternatives:
                alternatives = self.optimizer.find_alternative_routes(
                    graph,
                    origin_node,
                    dest_node,
                    num_alternatives=request.num_alternatives
                )[1:]  # Skip primary route
            
            # Calculate improvements
            improvements = self._calculate_improvements(baseline, primary)
            
            # Build response
            response = OptimizationResponse(
                primary_route=primary,
                alternative_routes=alternatives,
                baseline_route=baseline,
                improvements=improvements,
                metadata={
                    'total_processing_time_ms': int((time.time() - start_time) * 1000),
                    'nodes_in_graph': graph.number_of_nodes(),
                    'edges_in_graph': graph.number_of_edges(),
                    'vehicle_type': request.vehicle_profile.vehicle_type.value,
                    'optimization_criteria': request.optimization_criteria
                }
            )
            
            # Cache result
            cache_route(
                origin=request.origin,
                destination=request.destination,
                vehicle_type=request.vehicle_profile.vehicle_type.value,
                optimization=request.optimization_criteria,
                route=response
            )
            
            print(f"✓ Route optimized in {response.metadata['total_processing_time_ms']}ms")
            
            return response
            
        except Exception as e:
            print(f"✗ Optimization error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _add_optimization_weights(
        self,
        graph,
        criteria: str,
        vehicle: VehicleProfile
    ):
        """Add weights based on optimization criteria"""
        weights = {
            'distance': {'distance': 1.0, 'time': 0.0, 'cost': 0.0, 'emissions': 0.0},
            'time': {'distance': 0.2, 'time': 0.8, 'cost': 0.0, 'emissions': 0.0},
            'cost': {'distance': 0.2, 'time': 0.2, 'cost': 0.6, 'emissions': 0.0},
            'emissions': {'distance': 0.2, 'time': 0.2, 'cost': 0.0, 'emissions': 0.6},
            'balanced': {'distance': 0.3, 'time': 0.4, 'cost': 0.2, 'emissions': 0.1}
        }
        
        w = weights.get(criteria, weights['balanced'])
        
        return GraphUtils.add_weights_to_graph(
            graph,
            distance_weight=w['distance'],
            time_weight=w['time'],
            cost_weight=w['cost'],
            emissions_weight=w['emissions']
        )
    
    def _get_baseline_route(self, graph, origin, destination) -> Optional[RouteResult]:
        """Get simple distance-based route for comparison"""
        try:
            return self.bidirectional.optimize_route(graph, origin, destination, weight='length')
        except:
            return None
    
    def _calculate_improvements(
        self,
        baseline: Optional[RouteResult],
        optimized: RouteResult
    ) -> Dict[str, float]:
        """Calculate improvements over baseline"""
        if not baseline:
            return {
                'distance_saved_km': 0,
                'time_saved_minutes': 0,
                'cost_saved_usd': 0,
                'emissions_saved_kg': 0
            }
        
        return {
            'distance_saved_km': round(baseline.distance_km - optimized.distance_km, 2),
            'time_saved_minutes': round(baseline.time_minutes - optimized.time_minutes, 1),
            'cost_saved_usd': round(baseline.cost_usd - optimized.cost_usd, 2),
            'emissions_saved_kg': round(baseline.emissions_kg - optimized.emissions_kg, 2)
        }
