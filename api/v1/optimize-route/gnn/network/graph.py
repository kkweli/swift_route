"""
Graph operations and utilities for road networks
"""
import networkx as nx
from typing import List, Tuple, Dict, Optional
from functools import lru_cache


class GraphUtils:
    """Utility functions for graph operations"""
    
    @staticmethod
    def calculate_edge_weight(
        length_meters: float,
        speed_limit_kmh: int,
        road_type: str,
        distance_weight: float = 0.3,
        time_weight: float = 0.4,
        cost_weight: float = 0.2,
        emissions_weight: float = 0.1
    ) -> float:
        """
        Calculate edge weight based on multiple factors
        
        Args:
            length_meters: Road segment length
            speed_limit_kmh: Speed limit
            road_type: Type of road
            distance_weight: Weight for distance optimization
            time_weight: Weight for time optimization
            cost_weight: Weight for cost optimization
            emissions_weight: Weight for emissions optimization
        
        Returns:
            Weighted edge cost
        """
        # Distance component (normalized to km)
        distance_km = length_meters / 1000.0
        distance_cost = distance_km
        
        # Time component (hours)
        time_hours = distance_km / speed_limit_kmh
        time_cost = time_hours * 60  # Convert to minutes
        
        # Cost component (fuel cost estimate)
        # Assume 0.15 USD per km average
        fuel_cost = distance_km * 0.15
        
        # Emissions component (kg CO2)
        # Assume 0.12 kg CO2 per km average
        emissions_kg = distance_km * 0.12
        
        # Road type penalty (prefer highways over local roads)
        road_type_penalty = {
            'motorway': 1.0,
            'trunk': 1.1,
            'primary': 1.2,
            'secondary': 1.3,
            'tertiary': 1.4,
            'residential': 1.5,
            'service': 1.6
        }.get(road_type.lower(), 1.3)
        
        # Combine all factors
        total_weight = (
            distance_cost * distance_weight +
            time_cost * time_weight +
            fuel_cost * cost_weight +
            emissions_kg * emissions_weight
        ) * road_type_penalty
        
        return total_weight
    
    @staticmethod
    def add_weights_to_graph(
        graph: nx.DiGraph,
        distance_weight: float = 0.3,
        time_weight: float = 0.4,
        cost_weight: float = 0.2,
        emissions_weight: float = 0.1
    ) -> nx.DiGraph:
        """
        Add calculated weights to all edges in graph
        
        Args:
            graph: NetworkX graph
            distance_weight: Weight for distance
            time_weight: Weight for time
            cost_weight: Weight for cost
            emissions_weight: Weight for emissions
        
        Returns:
            Graph with 'weight' attribute on edges
        """
        for u, v, data in graph.edges(data=True):
            weight = GraphUtils.calculate_edge_weight(
                length_meters=data.get('length', 1000),
                speed_limit_kmh=data.get('speed_limit', 50),
                road_type=data.get('road_type', 'unknown'),
                distance_weight=distance_weight,
                time_weight=time_weight,
                cost_weight=cost_weight,
                emissions_weight=emissions_weight
            )
            graph[u][v]['weight'] = weight
        
        return graph
    
    @staticmethod
    def extract_route_coordinates(
        graph: nx.DiGraph,
        path: List[str]
    ) -> List[Tuple[float, float]]:
        """
        Extract coordinates from a path of node IDs
        
        Args:
            graph: NetworkX graph
            path: List of node IDs
        
        Returns:
            List of (lat, lng) tuples
        """
        coordinates = []
        for node_id in path:
            node_data = graph.nodes.get(node_id, {})
            lat = node_data.get('lat', 0)
            lng = node_data.get('lng', 0)
            coordinates.append((lat, lng))
        
        return coordinates
    
    @staticmethod
    def calculate_route_metrics(
        graph: nx.DiGraph,
        path: List[str]
    ) -> Dict[str, float]:
        """
        Calculate metrics for a route
        
        Args:
            graph: NetworkX graph
            path: List of node IDs
        
        Returns:
            Dictionary with distance, time, cost, emissions
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
