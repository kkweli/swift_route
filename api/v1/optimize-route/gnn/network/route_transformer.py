"""
Route Transformer
Converts OSRM responses to SwiftRoute format
"""
from typing import Dict, Any, List
from dataclasses import dataclass
from ..models.vehicle import VehicleProfile


@dataclass
class RouteResult:
    """Result of route optimization"""
    path: List[str]  # List of node IDs (empty for OSRM)
    coordinates: List[tuple]  # List of (lat, lng)
    distance_km: float
    time_minutes: float
    cost_usd: float
    emissions_kg: float
    confidence_score: float
    algorithm_used: str
    processing_time_ms: int


@dataclass
class OptimizationResponse:
    """Complete optimization response"""
    primary_route: RouteResult
    alternative_routes: List[RouteResult]
    baseline_route: RouteResult
    improvements: Dict[str, float]
    metadata: Dict[str, Any]


class RouteTransformer:
    """
    Transforms OSRM responses to SwiftRoute format
    """
    
    @staticmethod
    def transform_route(
        osrm_response: Dict[str, Any],
        vehicle_profile: VehicleProfile,
        processing_time_ms: int = 0
    ) -> OptimizationResponse:
        """
        Transform OSRM response to SwiftRoute format
        
        Args:
            osrm_response: Raw OSRM API response
            vehicle_profile: Vehicle characteristics for cost calculation
            processing_time_ms: Total processing time
            
        Returns:
            OptimizationResponse in SwiftRoute format
            
        Raises:
            ValueError: If OSRM response is invalid
        """
        if osrm_response.get("code") != "Ok":
            error_msg = osrm_response.get("message", "Unknown error")
            raise ValueError(f"OSRM error: {error_msg}")
        
        routes = osrm_response.get("routes", [])
        if not routes:
            raise ValueError("No route found between origin and destination")
        
        # Primary route
        primary = routes[0]
        primary_route = RouteTransformer._transform_single_route(
            primary, 
            vehicle_profile,
            algorithm="osrm",
            processing_time_ms=processing_time_ms
        )
        
        # Alternative routes (max 2)
        alternatives = []
        for i, route in enumerate(routes[1:3]):
            alt_route = RouteTransformer._transform_single_route(
                route,
                vehicle_profile,
                algorithm="osrm_alternative",
                processing_time_ms=processing_time_ms
            )
            alternatives.append(alt_route)
        
        # Baseline (same as primary for OSRM since we don't have comparison)
        baseline = RouteTransformer._transform_single_route(
            primary,
            vehicle_profile,
            algorithm="osrm_baseline",
            processing_time_ms=processing_time_ms
        )
        
        # Calculate improvements (minimal since baseline is same)
        improvements = {
            'distance_saved_km': 0.0,
            'time_saved_minutes': 0.0,
            'cost_saved_usd': 0.0,
            'emissions_saved_kg': 0.0
        }
        
        return OptimizationResponse(
            primary_route=primary_route,
            alternative_routes=alternatives,
            baseline_route=baseline,
            improvements=improvements,
            metadata={
                'routing_engine': 'osrm',
                'osrm_version': osrm_response.get('version', 'unknown'),
                'total_processing_time_ms': processing_time_ms,
                'nodes_in_graph': 0,  # Not applicable for OSRM
                'edges_in_graph': 0,
                'vehicle_type': vehicle_profile.vehicle_type.value,
                'optimization_criteria': 'time'
            }
        )
    
    @staticmethod
    def _transform_single_route(
        osrm_route: Dict[str, Any],
        vehicle_profile: VehicleProfile,
        algorithm: str,
        processing_time_ms: int
    ) -> RouteResult:
        """
        Transform single OSRM route to RouteResult
        
        Args:
            osrm_route: Single route from OSRM response
            vehicle_profile: Vehicle characteristics
            algorithm: Algorithm name for metadata
            processing_time_ms: Processing time
            
        Returns:
            RouteResult object
        """
        # Extract coordinates from geometry
        geometry = osrm_route.get("geometry", {})
        coordinates = []
        
        if geometry.get("type") == "LineString":
            # GeoJSON format: [lng, lat] -> convert to (lat, lng)
            coordinates = [
                (lat, lng) 
                for lng, lat in geometry.get("coordinates", [])
            ]
        
        # Distance in meters, convert to km
        distance_km = osrm_route.get("distance", 0) / 1000.0
        
        # Duration in seconds, convert to minutes
        time_minutes = osrm_route.get("duration", 0) / 60.0
        
        # Calculate cost based on distance and vehicle
        cost_usd = RouteTransformer._calculate_cost(distance_km, vehicle_profile)
        
        # Calculate emissions
        emissions_kg = RouteTransformer._calculate_emissions(distance_km, vehicle_profile)
        
        return RouteResult(
            path=[],  # OSRM doesn't provide node IDs
            coordinates=coordinates,
            distance_km=round(distance_km, 2),
            time_minutes=round(time_minutes, 1),
            cost_usd=round(cost_usd, 2),
            emissions_kg=round(emissions_kg, 2),
            confidence_score=0.98,  # High confidence for OSRM
            algorithm_used=algorithm,
            processing_time_ms=processing_time_ms
        )
    
    @staticmethod
    def _calculate_cost(distance_km: float, vehicle: VehicleProfile) -> float:
        """
        Calculate route cost based on distance and vehicle
        
        Args:
            distance_km: Route distance in kilometers
            vehicle: Vehicle profile
            
        Returns:
            Estimated cost in USD
        """
        # Base cost per km varies by vehicle type
        cost_per_km = {
            'car': 0.15,
            'truck': 0.35,
            'van': 0.25,
            'motorcycle': 0.08,
            'bicycle': 0.0,
            'electric_car': 0.05
        }
        
        vehicle_type = vehicle.vehicle_type.value
        base_cost = cost_per_km.get(vehicle_type, 0.15)
        
        return distance_km * base_cost
    
    @staticmethod
    def _calculate_emissions(distance_km: float, vehicle: VehicleProfile) -> float:
        """
        Calculate CO2 emissions based on distance and vehicle
        
        Args:
            distance_km: Route distance in kilometers
            vehicle: Vehicle profile
            
        Returns:
            Estimated emissions in kg CO2
        """
        # Emissions in kg CO2 per km
        emissions_per_km = {
            'car': 0.12,
            'truck': 0.25,
            'van': 0.18,
            'motorcycle': 0.08,
            'bicycle': 0.0,
            'electric_car': 0.03  # Accounting for electricity generation
        }
        
        vehicle_type = vehicle.vehicle_type.value
        base_emissions = emissions_per_km.get(vehicle_type, 0.12)
        
        return distance_km * base_emissions
