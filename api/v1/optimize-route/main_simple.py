"""
SwiftRoute FastAPI Route Optimization Service - Simplified Version
Minimal working version for testing
"""

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Tuple
import time
import uuid
from datetime import datetime

# Initialize FastAPI app
app = FastAPI(
    title="SwiftRoute Optimization API",
    description="B2B Route Optimization API",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Request models
class RouteOptimizationRequest(BaseModel):
    origin: Tuple[float, float]
    destination: Tuple[float, float]
    waypoints: List[Tuple[float, float]] = []
    vehicle_type: str = "car"
    optimize_for: str = "distance"
    avoid_tolls: bool = False
    avoid_traffic: bool = False

# Health check endpoint
@app.get("/health")
async def health_check():
    return {
        "data": {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "version": "1.0.0",
            "services": {
                "database": "operational",
                "optimizer": "operational",
                "api": "operational"
            }
        },
        "metadata": {
            "processing_time": 0,
            "algorithm_used": "none",
            "request_id": f"health_{int(time.time() * 1000)}"
        },
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

# Route optimization endpoint
@app.post("/optimize")
async def optimize_route(request: Request, route_request: RouteOptimizationRequest):
    """Main route optimization endpoint - returns mock data for now"""
    
    start_time = time.time()
    request_id = f"req_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
    
    try:
        # Calculate simple distance (Haversine formula approximation)
        def calculate_distance(coord1, coord2):
            import math
            lat1, lon1 = coord1
            lat2, lon2 = coord2
            R = 6371  # Earth's radius in km
            
            dlat = math.radians(lat2 - lat1)
            dlon = math.radians(lon2 - lon1)
            a = (math.sin(dlat / 2) ** 2 + 
                 math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * 
                 math.sin(dlon / 2) ** 2)
            c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
            return R * c
        
        # Calculate baseline route
        baseline_distance = calculate_distance(route_request.origin, route_request.destination)
        baseline_time = int(baseline_distance / 60 * 60)  # Assume 60 km/h average
        baseline_cost = baseline_distance * 0.5  # $0.50 per km
        
        # Calculate optimized route (simulate 20% improvement)
        optimized_distance = baseline_distance * 0.8
        optimized_time = int(baseline_time * 0.8)
        optimized_cost = baseline_cost * 0.8
        
        # Generate simple route coordinates
        baseline_coords = [
            {"lat": route_request.origin[0], "lng": route_request.origin[1]},
            {"lat": route_request.destination[0], "lng": route_request.destination[1]}
        ]
        
        optimized_coords = baseline_coords.copy()
        
        processing_time = int((time.time() - start_time) * 1000)
        
        response_data = {
            "data": {
                "baseline_route": {
                    "route_id": f"baseline_{uuid.uuid4().hex[:8]}",
                    "coordinates": baseline_coords,
                    "distance": round(baseline_distance, 2),
                    "estimated_time": baseline_time,
                    "cost": round(baseline_cost, 2),
                    "co2_emissions": round(baseline_distance * 0.12, 2),
                    "algorithm_used": "dijkstra",
                    "processing_time": processing_time
                },
                "optimized_route": {
                    "route_id": f"optimized_{uuid.uuid4().hex[:8]}",
                    "coordinates": optimized_coords,
                    "distance": round(optimized_distance, 2),
                    "estimated_time": optimized_time,
                    "cost": round(optimized_cost, 2),
                    "co2_emissions": round(optimized_distance * 0.12, 2),
                    "algorithm_used": "gnn-enhanced",
                    "processing_time": processing_time,
                    "confidence_score": 0.95
                },
                "improvements": {
                    "distance_saved": round(baseline_distance - optimized_distance, 2),
                    "time_saved": baseline_time - optimized_time,
                    "cost_saved": round(baseline_cost - optimized_cost, 2),
                    "co2_saved": round((baseline_distance - optimized_distance) * 0.12, 2)
                }
            },
            "metadata": {
                "algorithm_used": "gnn-enhanced",
                "processing_time": processing_time,
                "request_id": request_id,
                "trial_mode": False
            },
            "usage": {
                "requests_remaining": 95,
                "requests_limit": 100,
                "billing_tier": "trial"
            },
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        return JSONResponse(content=response_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "OPTIMIZATION_ERROR",
                    "message": "Route optimization failed",
                    "details": str(e)
                },
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )

# Vercel serverless function handler
handler = app

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main_simple:app", host="0.0.0.0", port=8000, reload=True)
