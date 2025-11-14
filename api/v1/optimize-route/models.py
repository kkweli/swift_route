"""
SwiftRoute API Models
Pydantic models for request/response validation and serialization
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

class VehicleType(str, Enum):
    """Supported vehicle types"""
    CAR = "car"
    TRUCK = "truck"
    VAN = "van"
    MOTORCYCLE = "motorcycle"

class OptimizationPreference(str, Enum):
    """Optimization preferences"""
    DISTANCE = "distance"
    TIME = "time"
    COST = "cost"

class Coordinates(BaseModel):
    """Geographic coordinates"""
    lat: float = Field(..., ge=-90, le=90, description="Latitude in decimal degrees")
    lng: float = Field(..., ge=-180, le=180, description="Longitude in decimal degrees")
    
    @validator('lat')
    def validate_latitude(cls, v):
        if not -90 <= v <= 90:
            raise ValueError('Latitude must be between -90 and 90 degrees')
        return v
    
    @validator('lng')
    def validate_longitude(cls, v):
        if not -180 <= v <= 180:
            raise ValueError('Longitude must be between -180 and 180 degrees')
        return v

class TimeWindow(BaseModel):
    """Time window constraints"""
    start: str = Field(..., description="Start time in ISO 8601 format")
    end: str = Field(..., description="End time in ISO 8601 format")
    
    @validator('start', 'end')
    def validate_iso_format(cls, v):
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError('Time must be in ISO 8601 format')
        return v

class RouteConstraints(BaseModel):
    """Route optimization constraints"""
    avoid_traffic: bool = Field(default=False, description="Avoid high traffic areas")
    avoid_tolls: bool = Field(default=False, description="Avoid toll roads")
    time_window: Optional[TimeWindow] = Field(None, description="Time window constraints")
    max_distance_km: Optional[float] = Field(None, ge=0, description="Maximum route distance in kilometers")
    max_duration_minutes: Optional[int] = Field(None, ge=0, description="Maximum route duration in minutes")

class RouteOptimizationRequest(BaseModel):
    """Route optimization request model"""
    origin: Coordinates = Field(..., description="Starting point coordinates")
    destination: Coordinates = Field(..., description="Destination coordinates")
    vehicle_type: VehicleType = Field(default=VehicleType.CAR, description="Vehicle type for optimization")
    optimization_preference: OptimizationPreference = Field(
        default=OptimizationPreference.TIME, 
        description="Primary optimization objective"
    )
    constraints: Optional[RouteConstraints] = Field(None, description="Additional route constraints")
    
    class Config:
        schema_extra = {
            "example": {
                "origin": {"lat": -1.2921, "lng": 36.8219},
                "destination": {"lat": -1.2864, "lng": 36.8172},
                "vehicle_type": "car",
                "optimization_preference": "time",
                "constraints": {
                    "avoid_traffic": True,
                    "avoid_tolls": False,
                    "time_window": {
                        "start": "2025-10-26T08:00:00Z",
                        "end": "2025-10-26T18:00:00Z"
                    }
                }
            }
        }

class NavigationWaypoint(BaseModel):
    """Navigation waypoint with instructions"""
    coordinates: Coordinates
    instruction: str = Field(..., description="Turn-by-turn instruction")
    distance_to_next: float = Field(..., ge=0, description="Distance to next waypoint in meters")
    estimated_time: int = Field(..., ge=0, description="Estimated time to next waypoint in seconds")

class AlternativeRoute(BaseModel):
    """Alternative route option"""
    route_id: str
    coordinates: List[Coordinates]
    distance_km: float = Field(..., ge=0)
    estimated_time_minutes: int = Field(..., ge=0)
    estimated_cost: float = Field(..., ge=0)
    description: str = Field(..., description="Route description (e.g., 'Via Highway A1')")

class EfficiencyMetrics(BaseModel):
    """Route efficiency metrics"""
    distance_vs_direct: float = Field(..., description="Route distance vs direct distance ratio")
    time_vs_baseline: float = Field(..., description="Route time vs baseline algorithm ratio")
    cost_optimization: float = Field(..., description="Cost optimization percentage")
    traffic_avoidance: float = Field(default=0.0, description="Traffic avoidance percentage")

class OptimizedRoute(BaseModel):
    """Optimized route response model"""
    route_id: str = Field(..., description="Unique route identifier")
    coordinates: List[Coordinates] = Field(..., description="Route coordinates as polyline points")
    distance_km: float = Field(..., ge=0, description="Total route distance in kilometers")
    estimated_time_minutes: int = Field(..., ge=0, description="Estimated travel time in minutes")
    estimated_cost: float = Field(..., ge=0, description="Estimated route cost")
    alternative_routes: Optional[List[AlternativeRoute]] = Field(None, description="Alternative route options")
    waypoints: List[NavigationWaypoint] = Field(default=[], description="Turn-by-turn navigation waypoints")
    efficiency_metrics: EfficiencyMetrics = Field(..., description="Route efficiency metrics")
    metadata: Dict[str, Any] = Field(default={}, description="Additional route metadata")
    
    class Config:
        schema_extra = {
            "example": {
                "route_id": "route_1698336000000_abc123",
                "coordinates": [
                    {"lat": -1.2921, "lng": 36.8219},
                    {"lat": -1.2900, "lng": 36.8200},
                    {"lat": -1.2864, "lng": 36.8172}
                ],
                "distance_km": 2.5,
                "estimated_time_minutes": 8,
                "estimated_cost": 150.0,
                "waypoints": [
                    {
                        "coordinates": {"lat": -1.2900, "lng": 36.8200},
                        "instruction": "Turn right onto Kenyatta Avenue",
                        "distance_to_next": 500,
                        "estimated_time": 120
                    }
                ],
                "efficiency_metrics": {
                    "distance_vs_direct": 1.15,
                    "time_vs_baseline": 0.92,
                    "cost_optimization": 8.5,
                    "traffic_avoidance": 15.0
                },
                "metadata": {
                    "algorithm_used": "gnn-astar",
                    "traffic_considered": True,
                    "road_segments_analyzed": 1250
                }
            }
        }

class APIError(BaseModel):
    """API error response model"""
    error: Dict[str, Any] = Field(..., description="Error details")
    request_id: str = Field(..., description="Request identifier")
    timestamp: str = Field(..., description="Error timestamp in ISO 8601 format")
    
    class Config:
        schema_extra = {
            "example": {
                "error": {
                    "code": "INVALID_COORDINATES",
                    "message": "Invalid latitude or longitude values",
                    "details": "Latitude must be between -90 and 90 degrees"
                },
                "request_id": "req_1698336000000_def456",
                "timestamp": "2025-10-26T12:00:00.000Z"
            }
        }

class HealthCheckResponse(BaseModel):
    """Health check response model"""
    status: str = Field(..., description="Service status")
    timestamp: str = Field(..., description="Health check timestamp")
    version: str = Field(..., description="API version")
    services: Dict[str, str] = Field(..., description="Service status details")
    
    class Config:
        schema_extra = {
            "example": {
                "status": "healthy",
                "timestamp": "2025-10-26T12:00:00.000Z",
                "version": "1.0.0",
                "services": {
                    "database": "operational",
                    "optimizer": "operational",
                    "gnn_model": "loading"
                }
            }
        }

class UsageInfo(BaseModel):
    """API usage information"""
    requests_remaining: int = Field(..., description="Remaining requests in current period")
    billing_tier: str = Field(..., description="Current billing tier")
    rate_limit_reset: Optional[str] = Field(None, description="Rate limit reset time")

class APIResponse(BaseModel):
    """Standard API response wrapper"""
    data: Any = Field(..., description="Response data")
    metadata: Dict[str, Any] = Field(default={}, description="Response metadata")
    usage: Dict[str, Any] = Field(default={}, description="Usage information")
    request_id: str = Field(..., description="Request identifier")
    timestamp: str = Field(..., description="Response timestamp")
    
    class Config:
        schema_extra = {
            "example": {
                "data": {"status": "healthy"},
                "metadata": {
                    "processing_time": 45,
                    "algorithm_used": "astar",
                    "request_id": "health_1698336000000"
                },
                "usage": {
                    "requests_remaining": 49,
                    "billing_tier": "professional"
                },
                "request_id": "req_1698336000000_abc123",
                "timestamp": "2025-10-26T12:00:00.000Z"
            }
        }

# Validation utilities
def validate_coordinates_distance(origin: Coordinates, destination: Coordinates) -> bool:
    """Validate that coordinates are not too far apart (basic check)"""
    import math
    
    # Calculate approximate distance using Haversine formula
    lat1, lon1 = math.radians(origin.lat), math.radians(origin.lng)
    lat2, lon2 = math.radians(destination.lat), math.radians(destination.lng)
    
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Earth radius in kilometers
    distance_km = 6371 * c
    
    # Maximum reasonable distance for route optimization (1000 km)
    return distance_km <= 1000

def validate_time_window(time_window: TimeWindow) -> bool:
    """Validate that time window is logical"""
    try:
        start_time = datetime.fromisoformat(time_window.start.replace('Z', '+00:00'))
        end_time = datetime.fromisoformat(time_window.end.replace('Z', '+00:00'))
        
        # End time must be after start time
        if end_time <= start_time:
            return False
        
        # Time window should not be more than 24 hours
        duration = end_time - start_time
        if duration.total_seconds() > 24 * 3600:
            return False
        
        return True
    except:
        return False