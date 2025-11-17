"""
Main route optimization engine
Coordinates all components for route optimization
Now uses OSRM for routing instead of database

VERCEL HOBBY PLAN OPTIMIZATION:
- Uses external OSRM API (no local graph processing)
- Minimal dependencies for fast cold starts (<3s)
- Simple in-memory caching (no Redis needed)
- No ML libraries (PyTorch, TensorFlow) to stay under size limits
- Stateless design for serverless compatibility

This approach trades advanced GNN features for:
✓ Zero database maintenance
✓ Global coverage (not just Nairobi)
✓ Always up-to-date road data
✓ Fast deployment and scaling
✓ Lower costs on Hobby plan
"""
import time
from typing import List, Optional, Tuple, Dict
from dataclasses import dataclass, asdict

from ..network.osrm_client import OSRMClient, OSRMError
from ..network.route_transformer import RouteTransformer, RouteResult, OptimizationResponse
from ..models.vehicle import VehicleProfile


@dataclass
class OptimizationRequest:
    """Route optimization request"""
    origin: Tuple[float, float]  # (lat, lng)
    destination: Tuple[float, float]
    vehicle_profile: VehicleProfile
    optimization_criteria: str = 'time'  # 'time', 'distance', 'cost', 'emissions'
    find_alternatives: bool = True
    num_alternatives: int = 2


class RouteOptimizationEngine:
    """
    Main engine for route optimization using OSRM
    """
    
    def __init__(self):
        """Initialize optimization engine with OSRM"""
        self.osrm_client = OSRMClient()
        self.transformer = RouteTransformer()
        self.cache = {}  # Simple in-memory cache
    
    def optimize(self, request: OptimizationRequest) -> Optional[OptimizationResponse]:
        """
        Optimize route using OSRM
        
        Args:
            request: Optimization request
        
        Returns:
            OptimizationResponse or None if failed
        """
        start_time = time.time()
        
        try:
            # Check cache
            cache_key = self._get_cache_key(request)
            if cache_key in self.cache:
                cached_result, cached_time = self.cache[cache_key]
                # Cache valid for 1 hour
                if time.time() - cached_time < 3600:
                    print("✓ Using cached route")
                    return cached_result
            
            # Map vehicle type to OSRM profile
            profile = self._map_vehicle_to_profile(request.vehicle_profile)
            
            print(f"Requesting route from OSRM...")
            print(f"  Origin: {request.origin}")
            print(f"  Destination: {request.destination}")
            print(f"  Profile: {profile}")
            
            # Get route from OSRM
            osrm_response = self.osrm_client.get_route(
                origin=request.origin,
                destination=request.destination,
                profile=profile,
                alternatives=request.find_alternatives,
                steps=True,
                geometries="geojson"
            )
            
            # Calculate processing time
            processing_time = int((time.time() - start_time) * 1000)
            
            # Transform to SwiftRoute format
            response = self.transformer.transform_route(
                osrm_response,
                request.vehicle_profile,
                processing_time_ms=processing_time
            )
            
            # Cache result
            self.cache[cache_key] = (response, time.time())
            
            # Limit cache size (LRU-like)
            if len(self.cache) > 1000:
                # Remove oldest 100 entries
                sorted_cache = sorted(self.cache.items(), key=lambda x: x[1][1])
                for key, _ in sorted_cache[:100]:
                    del self.cache[key]
            
            print(f"✓ Route optimized in {processing_time}ms")
            print(f"  Distance: {response.primary_route.distance_km} km")
            print(f"  Time: {response.primary_route.time_minutes} min")
            print(f"  Alternatives: {len(response.alternative_routes)}")
            
            return response
            
        except OSRMError as e:
            print(f"✗ OSRM error: {e}")
            return None
        except Exception as e:
            print(f"✗ Optimization error: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _map_vehicle_to_profile(self, vehicle: VehicleProfile) -> str:
        """
        Map SwiftRoute vehicle type to OSRM routing profile
        
        Args:
            vehicle: Vehicle profile
            
        Returns:
            OSRM profile name (car, bike, foot)
        """
        mapping = {
            'car': 'car',
            'truck': 'car',  # OSRM doesn't have truck profile
            'van': 'car',
            'motorcycle': 'car',
            'bicycle': 'bike',
            'electric_car': 'car'
        }
        return mapping.get(vehicle.vehicle_type.value, 'car')
    
    def _get_cache_key(self, request: OptimizationRequest) -> str:
        """
        Generate cache key from request
        
        Args:
            request: Optimization request
            
        Returns:
            Cache key string
        """
        return f"{request.origin}_{request.destination}_{request.vehicle_profile.vehicle_type.value}"
