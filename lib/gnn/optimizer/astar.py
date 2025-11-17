"""
A* pathfinding algorithm for route optimization
Lightweight alternative to GNN for Vercel serverless
"""
import networkx as nx
import time
from typing import List, Optional, Tuple, Dict
from dataclasses import dataclass
import math


@dataclass
class RouteResult:
    """Result of route optimization"""
    path: List[str]  # List of node IDs
    coordinates: List[Tuple[float, float]]  # List of (lat, lng)
    distance_km: float
    time_minutes: float
    cost_usd: float
    emissions_kg: float
    confidence_score: float
    algorithm_used: str
    processing_time_ms: int


class AStarOptimizer:
    """
    A* algorithm for route optimization
    Optimized for Vercel serverless constraints
    """
    
    def __init__(self, max_execution_time_seconds: int = 8):
        """
        Initialize optimizer
        
        Args:
            max_execution_time_seconds: Maximum time before timeout
        """
        self.max_execution_time = max_execution_time_seconds
        self.nodes_explored = 0
    
    def optimize_route(
        self,
        graph: nx.DiGraph,
        origin_node: str,
        destination_node: str,
        weight: str = 'weight'
    ) -> Optional[RouteResult]:
        """
        Find optimal route using A* algorithm
        
        Args:
            graph: Road network graph
            origin_node: Starting node ID
            destination_node: Ending node ID
            weight: Edge attribute to use as weight
        
        Returns:
            RouteResult or None if no path found
        """
        start_time = time.time()
        self.nodes_explored = 0
        
        try:
            # Get destination coordinates for heuristic
            dest_lat = graph.nodes[destination_node].get('lat', 0)
            dest_lng = graph.nodes[destination_node].get('lng', 0)
            
            # Define heuristic function (Euclidean distance)
            def heuristic(node):
                node_lat = graph.nodes[node].get('lat', 0)
                node_lng = graph.nodes[node].get('lng', 0)
                return self._haversine_distance(
                    node_lat, node_lng, dest_lat, dest_lng
                )
            
            # Run A* algorithm
            path = nx.astar_path(
                graph,
                origin_node,
                destination_node,
                heuristic=heuristic,
                weight=weight
            )
            
            # Calculate metrics
            metrics = self._calculate_metrics(graph, path)
            
            # Extract coordinates
            coordinates = [
                (graph.nodes[node]['lat'], graph.nodes[node]['lng'])
                for node in path
            ]
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return RouteResult(
                path=path,
                coordinates=coordinates,
                distance_km=metrics['distance_km'],
                time_minutes=metrics['time_minutes'],
                cost_usd=metrics['cost_usd'],
                emissions_kg=metrics['emissions_kg'],
                confidence_score=0.95,  # High confidence for A*
                algorithm_used='astar',
                processing_time_ms=processing_time
            )
            
        except nx.NetworkXNoPath:
            return None
        except Exception as e:
            print(f"A* optimization error: {e}")
            return None
    
    def find_alternative_routes(
        self,
        graph: nx.DiGraph,
        origin_node: str,
        destination_node: str,
        num_alternatives: int = 2
    ) -> List[RouteResult]:
        """
        Find multiple alternative routes
        
        Args:
            graph: Road network graph
            origin_node: Starting node
            destination_node: Ending node
            num_alternatives: Number of alternatives to find
        
        Returns:
            List of RouteResult objects
        """
        routes = []
        
        # Get primary route
        primary = self.optimize_route(graph, origin_node, destination_node)
        if primary:
            routes.append(primary)
        
        # Find alternatives by temporarily removing edges from primary route
        if primary and num_alternatives > 0:
            graph_copy = graph.copy()
            
            for i in range(num_alternatives):
                if i >= len(primary.path) - 1:
                    break
                
                # Remove an edge from primary route
                u, v = primary.path[i], primary.path[i + 1]
                if graph_copy.has_edge(u, v):
                    graph_copy.remove_edge(u, v)
                
                # Find alternative
                alt_route = self.optimize_route(graph_copy, origin_node, destination_node)
                if alt_route and alt_route.path != primary.path:
                    routes.append(alt_route)
        
        return routes
    
    @staticmethod
    def _haversine_distance(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
        """
        Calculate distance between two points using Haversine formula
        
        Args:
            lat1, lng1: First point
            lat2, lng2: Second point
        
        Returns:
            Distance in kilometers
        """
        R = 6371  # Earth radius in km
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        dlat = math.radians(lat2 - lat1)
        dlng = math.radians(lng2 - lng1)
        
        a = (math.sin(dlat / 2) ** 2 +
             math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2)
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        
        return R * c
    
    @staticmethod
    def _calculate_metrics(graph: nx.DiGraph, path: List[str]) -> Dict[str, float]:
        """
        Calculate route metrics
        
        Args:
            graph: Road network graph
            path: List of node IDs
        
        Returns:
            Dictionary with metrics
        """
        total_distance = 0.0
        total_time = 0.0
        total_cost = 0.0
        total_emissions = 0.0
        
        for i in range(len(path) - 1):
            u, v = path[i], path[i + 1]
            edge_data = graph.get_edge_data(u, v, {})
            
            length_km = edge_data.get('length', 0) / 1000.0
            speed_kmh = edge_data.get('speed_limit', 50)
            
            total_distance += length_km
            total_time += (length_km / speed_kmh) * 60  # minutes
            total_cost += length_km * 0.15  # USD
            total_emissions += length_km * 0.12  # kg CO2
        
        return {
            'distance_km': round(total_distance, 2),
            'time_minutes': round(total_time, 1),
            'cost_usd': round(total_cost, 2),
            'emissions_kg': round(total_emissions, 2)
        }


class BidirectionalOptimizer:
    """
    Bidirectional search for faster pathfinding
    Searches from both origin and destination simultaneously
    """
    
    @staticmethod
    def optimize_route(
        graph: nx.DiGraph,
        origin_node: str,
        destination_node: str,
        weight: str = 'weight'
    ) -> Optional[RouteResult]:
        """
        Find route using bidirectional search
        
        Args:
            graph: Road network graph
            origin_node: Starting node
            destination_node: Ending node
            weight: Edge weight attribute
        
        Returns:
            RouteResult or None
        """
        start_time = time.time()
        
        try:
            # Use NetworkX bidirectional Dijkstra
            length, path = nx.bidirectional_dijkstra(
                graph,
                origin_node,
                destination_node,
                weight=weight
            )
            
            # Calculate metrics
            metrics = AStarOptimizer._calculate_metrics(graph, path)
            
            # Extract coordinates
            coordinates = [
                (graph.nodes[node]['lat'], graph.nodes[node]['lng'])
                for node in path
            ]
            
            processing_time = int((time.time() - start_time) * 1000)
            
            return RouteResult(
                path=path,
                coordinates=coordinates,
                distance_km=metrics['distance_km'],
                time_minutes=metrics['time_minutes'],
                cost_usd=metrics['cost_usd'],
                emissions_kg=metrics['emissions_kg'],
                confidence_score=0.98,  # Very high confidence
                algorithm_used='bidirectional_dijkstra',
                processing_time_ms=processing_time
            )
            
        except nx.NetworkXNoPath:
            return None
        except Exception as e:
            print(f"Bidirectional optimization error: {e}")
            return None
