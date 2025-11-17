"""
SwiftRoute Intelligent Route Optimization API
Vercel Serverless Handler with A* Algorithm
"""
import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler
import sys
import os

# Add current directory to path for imports
sys.path.insert(0, os.path.dirname(__file__))

from gnn.optimizer.engine import RouteOptimizationEngine, OptimizationRequest
from gnn.models.vehicle import VehicleProfile, VehicleType, FuelType


class handler(BaseHTTPRequestHandler):
    """Vercel serverless function handler"""
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests - health check"""
        response_data = {
            "data": {
                "status": "healthy",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "version": "2.0.0-intelligent",
                "services": {
                    "python": "operational",
                    "optimizer": "operational",
                    "database": "operational"
                }
            },
            "metadata": {
                "processing_time": 0,
                "request_id": "health_check",
                "algorithm": "astar"
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())
    
    def do_POST(self):
        """Handle POST requests - route optimization"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body) if body else {}
            
            # Parse request
            origin = tuple(data.get('origin', [-1.2921, 36.8219]))  # Default: Nairobi center
            destination = tuple(data.get('destination', [-1.2864, 36.8172]))
            vehicle_type = data.get('vehicle_type', 'car')
            optimization = data.get('optimize_for', 'time')
            
            # Create vehicle profile
            vehicle_profile = self._create_vehicle_profile(vehicle_type, data)
            
            # Create optimization request
            request = OptimizationRequest(
                origin=origin,
                destination=destination,
                vehicle_profile=vehicle_profile,
                optimization_criteria=optimization,
                find_alternatives=data.get('find_alternatives', True),
                num_alternatives=data.get('num_alternatives', 2)
            )
            
            # Initialize engine and optimize
            print(f"Optimizing route from {origin} to {destination}")
            print(f"Vehicle: {vehicle_type}, Optimization: {optimization}")
            
            engine = RouteOptimizationEngine()
            result = engine.optimize(request)
            
            if not result:
                raise Exception("No route found between origin and destination. Check if road network data exists in database.")
            
            # Format response
            response_data = self._format_response(result)
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            import traceback
            
            # Get detailed error info
            error_details = {
                "error_type": type(e).__name__,
                "error_message": str(e),
                "traceback": traceback.format_exc()
            }
            
            print(f"=== OPTIMIZATION ERROR ===")
            print(f"Error: {e}")
            print(f"Type: {type(e).__name__}")
            print(f"Request data: {data if 'data' in locals() else 'N/A'}")
            traceback.print_exc()
            print("=" * 50)
            
            error_response = {
                "error": {
                    "code": "OPTIMIZATION_ERROR",
                    "message": "Route optimization failed",
                    "details": str(e),
                    "debug_info": error_details if os.getenv('DEBUG') else None
                },
                "request_id": f"error_{int(datetime.utcnow().timestamp())}",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
    
    def _create_vehicle_profile(self, vehicle_type: str, data: dict) -> VehicleProfile:
        """Create vehicle profile from request data"""
        # Use predefined profiles
        if vehicle_type == 'truck':
            return VehicleProfile.create_truck()
        elif vehicle_type == 'electric_car':
            return VehicleProfile.create_electric_car()
        elif vehicle_type == 'motorcycle':
            return VehicleProfile.create_motorcycle()
        else:
            return VehicleProfile.create_car()
    
    def _format_response(self, result) -> dict:
        """Format optimization result for API response"""
        primary = result.primary_route
        baseline = result.baseline_route
        
        return {
            "data": {
                "baseline_route": {
                    "route_id": "baseline",
                    "coordinates": [{"lat": lat, "lng": lng} for lat, lng in baseline.coordinates] if baseline else [],
                    "distance": baseline.distance_km if baseline else 0,
                    "estimated_time": baseline.time_minutes if baseline else 0,
                    "cost": baseline.cost_usd if baseline else 0,
                    "co2_emissions": baseline.emissions_kg if baseline else 0,
                    "algorithm_used": baseline.algorithm_used if baseline else "none"
                },
                "optimized_route": {
                    "route_id": "optimized",
                    "coordinates": [{"lat": lat, "lng": lng} for lat, lng in primary.coordinates],
                    "distance": primary.distance_km,
                    "estimated_time": primary.time_minutes,
                    "cost": primary.cost_usd,
                    "co2_emissions": primary.emissions_kg,
                    "algorithm_used": primary.algorithm_used,
                    "confidence_score": primary.confidence_score
                },
                "alternative_routes": [
                    {
                        "route_id": f"alt_{i}",
                        "coordinates": [{"lat": lat, "lng": lng} for lat, lng in alt.coordinates],
                        "distance": alt.distance_km,
                        "estimated_time": alt.time_minutes,
                        "cost": alt.cost_usd,
                        "co2_emissions": alt.emissions_kg
                    }
                    for i, alt in enumerate(result.alternative_routes)
                ],
                "improvements": {
                    "distance_saved": result.improvements['distance_saved_km'],
                    "time_saved": result.improvements['time_saved_minutes'],
                    "cost_saved": result.improvements['cost_saved_usd'],
                    "co2_saved": result.improvements['emissions_saved_kg']
                }
            },
            "metadata": {
                "algorithm_used": primary.algorithm_used,
                "processing_time": result.metadata['total_processing_time_ms'],
                "request_id": f"req_{int(datetime.utcnow().timestamp())}",
                "nodes_in_graph": result.metadata['nodes_in_graph'],
                "edges_in_graph": result.metadata['edges_in_graph']
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
