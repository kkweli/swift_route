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
from .enhanced_optimizer import EnhancedOptimizer


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
        """Initialize optimization engine with Enhanced Optimizer"""
        self.enhanced_optimizer = EnhancedOptimizer()
        self.cache = {}  # Simple in-memory cache
    
    def optimize(self, request: OptimizationRequest) -> Optional[OptimizationResponse]:
        """
        Optimize route using Enhanced Optimizer
        
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
            
            print(f"Optimizing route with Enhanced Optimizer...")
            print(f"  Origin: {request.origin}")
            print(f"  Destination: {request.destination}")
            print(f"  Criteria: {request.optimization_criteria}")
            
            # Use enhanced optimizer for meaningful variance
            response = self.enhanced_optimizer.optimize(
                origin=request.origin,
                destination=request.destination,
                vehicle_profile=request.vehicle_profile,
                optimization_criteria=request.optimization_criteria,
                find_alternatives=request.find_alternatives
            )
            
            if not response:
                raise Exception("Enhanced optimizer returned no result")
            
            # Cache result
            self.cache[cache_key] = (response, time.time())
            
            # Limit cache size (LRU-like)
            if len(self.cache) > 1000:
                # Remove oldest 100 entries
                sorted_cache = sorted(self.cache.items(), key=lambda x: x[1][1])
                for key, _ in sorted_cache[:100]:
                    del self.cache[key]
            
            processing_time = int((time.time() - start_time) * 1000)
            
            print(f"✓ Route optimized in {processing_time}ms")
            print(f"  Baseline: {response.baseline_route.distance_km} km, {response.baseline_route.time_minutes} min")
            print(f"  Optimized: {response.primary_route.distance_km} km, {response.primary_route.time_minutes} min")
            print(f"  Savings: {response.improvements['distance_saved_km']} km, {response.improvements['time_saved_minutes']} min")
            print(f"  Alternatives: {len(response.alternative_routes)}")
            
            return response
            
        except Exception as e:
            print(f"✗ Optimization error: {e}")
            import traceback
            traceback.print_exc()
            return None

    def _get_cache_key(self, request: OptimizationRequest) -> str:
        """
        Generate cache key from request
        
        Args:
            request: Optimization request
            
        Returns:
            Cache key string
        """
        return f"{request.origin}_{request.destination}_{request.vehicle_profile.vehicle_type.value}"
