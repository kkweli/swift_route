"""
SwiftRoute Intelligent Route Optimization API
Vercel Serverless Handler with A* Algorithm
"""
import json
from datetime import datetime
import logging
from http.server import BaseHTTPRequestHandler
import sys
import os


def _clean_env(name: str, default: str = "") -> str:
    val = os.getenv(name, default)
    try:
        return val.strip().rstrip() if isinstance(val, str) else default
    except Exception:
        return default

print("--- Python handler starting ---")
print(f"Python version: {sys.version}")
print(f"Current working directory: {os.getcwd()}")
print(f"File path: {__file__}")
print(f"Initial sys.path: {sys.path}")

# Add lib directory to path for imports
try:
    # Vercel typically runs scripts from the project root
    lib_path = os.path.join(os.getcwd(), 'lib')
    if lib_path not in sys.path:
        sys.path.insert(0, lib_path)
    print(f"SUCCESS: 'lib' directory added to sys.path: {lib_path}")
    print(f"Updated sys.path: {sys.path}")
except Exception as e:
    print(f"ERROR: Failed to modify sys.path: {e}")

IMPORTS_OK = True
IMPORTS_ERROR = None
try:
    from gnn.optimizer.engine import RouteOptimizationEngine, OptimizationRequest
    print("SUCCESS: Imported gnn.optimizer modules")
    from gnn.models.vehicle import VehicleProfile, VehicleType, FuelType
    print("SUCCESS: Imported gnn.models modules")
except Exception as e:
    IMPORTS_OK = False
    IMPORTS_ERROR = str(e)
    print(f"ERROR during gnn imports (degraded mode): {e}")

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
                "status": "healthy" if IMPORTS_OK else "degraded",
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
            # Fail fast if imports failed to avoid generic Vercel errors
            if not IMPORTS_OK:
                error_response = {
                    "error": {
                        "code": "DEPENDENCY_IMPORT_ERROR",
                        "message": "Optimizer dependencies failed to import",
                        "details": IMPORTS_ERROR
                    },
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                self.send_response(500)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(error_response).encode())
                return

            # Check for internal auth token (only for internal calls from Node.js)
            internal_auth = self.headers.get('X-Internal-Auth')
            expected_auth = _clean_env('INTERNAL_AUTH_SECRET', 'internal-secret-key')
            # Log presence of internal auth without printing secret values
            logging.info(f"Internal auth header present: {bool(internal_auth)}; internal secret configured: {bool(expected_auth)}")
            
            if not internal_auth or internal_auth != expected_auth:
                error_response = {
                    "error": {
                        "code": "UNAUTHORIZED",
                        "message": "This endpoint requires authentication. Use /api/v1/optimize-route instead."
                    },
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
                
                self.send_response(401)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps(error_response).encode())
                return
            
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            try:
                data = json.loads(body) if body else {}
            except json.JSONDecodeError:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(json.dumps({
                    "error": {"code": "BAD_REQUEST", "message": "Invalid JSON body"},
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }).encode())
                return
            
            # Parse request
            origin = tuple(data.get('origin', [-1.2921, 36.8219]))  # Default: Nairobi center
            destination = tuple(data.get('destination', [-1.2864, 36.8172]))
            vehicle_type = data.get('vehicle_type', 'car')
            optimization = data.get('optimize_for', 'time')
            factor = float(data.get('factor', 1.0)) if data.get('factor') is not None else 1.0
            include_explanation = bool(data.get('include_explanation', False))

            # Create vehicle profile (fallback if import fails)
            try:
                vehicle_profile = self._create_vehicle_profile(vehicle_type, data)
            except:
                vehicle_profile = None  # Will use fallback calculations

            # Create optimization request (restore proper GNN usage)
            request = OptimizationRequest(
                origin=origin,
                destination=destination,
                vehicle_profile=vehicle_profile,
                optimization_criteria=optimization,
                find_alternatives=data.get('find_alternatives', True),
                num_alternatives=int(data.get('num_alternatives', 2)),
                factor=factor,
                include_explanation=include_explanation
            )

            # Initialize engine and optimize (restore proper GNN calls)
            logging.info(f"Optimizing route from {origin} to {destination}")
            logging.info(f"Vehicle: {vehicle_type}, Optimization: {optimization}")

            engine = RouteOptimizationEngine()
            result = engine.optimize(request)

            if not result:
                raise Exception("No route found between origin and destination. Check if road network data exists in database.")

            # Optionally produce an LLM explanation (lazy import + safe fallback)
            if request.include_explanation:
                # Build a lightweight candidate summary input for the summarizer
                candidates_input = []
                primary = result.primary_route
                candidates_input.append({
                    'distance': primary.distance_km,
                    'estimated_time': primary.time_minutes,
                    'cost': primary.cost_usd,
                    'co2_emissions': primary.emissions_kg,
                    'algorithm_used': primary.algorithm_used
                })
                for alt in result.alternative_routes:
                    candidates_input.append({
                        'distance': alt.distance_km,
                        'estimated_time': alt.time_minutes,
                        'cost': alt.cost_usd,
                        'co2_emissions': alt.emissions_kg,
                        'algorithm_used': alt.algorithm_used
                    })

                try:
                    # Import lazily so handler can start even if LLM package missing
                    from gnn.llm import summarize_candidates
                    import concurrent.futures
                    llm_timeout_ms = int(os.getenv('LLM_SUMMARY_TIMEOUT_MS', '800') or '800')
                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as _exec:
                        future = _exec.submit(summarize_candidates, candidates_input)
                        explanation = future.result(timeout=max(0.1, llm_timeout_ms / 1000.0))
                except Exception as e:
                    logging.warning(f"LLM summarization unavailable: {e}")
                    # Safe deterministic fallback summary (no coordinates, safe text)
                    if candidates_input:
                        explanation = " | ".join([
                            f"{i+1}: {c['distance']:.1f}km/{c['estimated_time']:.1f}m"
                            for i, c in enumerate(candidates_input)
                        ])
                    else:
                        explanation = "No explanation available"
            else:
                explanation = None

            # Format response (include explanation if present)
            response_data = self._format_response(result)
            if explanation:
                response_data['metadata']['explanation'] = explanation

            # Instrumentation: log optimization request and result to Supabase REST (non-blocking)
            try:
                self._log_optimization_event(request, result, response_data)
            except Exception as e:
                logging.warning(f"Failed to log optimization event: {e}")

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
            
            logging.error("=== OPTIMIZATION ERROR ===")
            logging.error(f"Error: {e}")
            logging.error(f"Type: {type(e).__name__}")
            # Avoid printing token or raw headers; print masked request values only
            logging.error(f"Request data keys: {list(data.keys()) if 'data' in locals() else 'N/A'}")
            if os.getenv('DEBUG'):
                traceback.print_exc()
            else:
                logging.error("Enable DEBUG to view full stacktrace")
            
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

    def _log_optimization_event(self, request_obj, result, response_data):
        """Send a log of the optimization request and result to Supabase REST API.

        The function uses environment variables `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
        Table: optimization_logs (suggested schema)
        { request_time, origin, destination, vehicle_type, optimization_criteria, processing_time_ms, baseline_time_minutes, optimized_time_minutes, improvements (json), traffic_info (json), confidence_score }
        """
        supabase_url = _clean_env('SUPABASE_URL')
        service_key = _clean_env('SUPABASE_SERVICE_ROLE_KEY')
        if not supabase_url or not service_key:
            return

        try:
            import urllib.request, urllib.error
            payload = {
                'request_time': datetime.utcnow().isoformat() + 'Z',
                'origin': json.dumps(request_obj.origin),
                'destination': json.dumps(request_obj.destination),
                'vehicle_type': request_obj.vehicle_profile.vehicle_type.value,
                'optimization_criteria': request_obj.optimization_criteria,
                'processing_time_ms': response_data.get('metadata', {}).get('processing_time', 0),
                'baseline_time_minutes': response_data.get('data', {}).get('baseline_route', {}).get('estimated_time', 0),
                'optimized_time_minutes': response_data.get('data', {}).get('optimized_route', {}).get('estimated_time', 0),
                'improvements': json.dumps(response_data.get('data', {}).get('improvements', {})),
                'traffic_info': json.dumps(response_data.get('data', {}).get('traffic_info', {})),
                'confidence_score': response_data.get('data', {}).get('optimized_route', {}).get('confidence_score', None)
            }

            endpoint = f"{supabase_url.rstrip('/')}/rest/v1/optimization_logs"
            data = json.dumps(payload).encode('utf-8')
            req = urllib.request.Request(endpoint, data=data, method='POST')
            req.add_header('apikey', service_key)
            req.add_header('Authorization', f'Bearer {service_key}')
            req.add_header('Content-Type', 'application/json')
            req.add_header('Prefer', 'return=representation')

            # Fire and forget but attempt to read response to ensure request completes
            try:
                timeout_sec = max(0.3, min(2.0, float(os.getenv('SUPABASE_LOG_TIMEOUT_SEC', '1'))))
                with urllib.request.urlopen(req, timeout=timeout_sec) as resp:
                    resp.read()
            except Exception as e:
                # non-fatal
                logging.debug(f"Optimization log POST failed: {e}")

        except Exception as e:
            logging.debug(f"Failed to prepare optimization log: {e}")
    
    def _format_response(self, result) -> dict:
        """Format optimization result for API response"""
        primary = result.primary_route
        baseline = result.baseline_route
        
        resp = {
            "data": {
                "baseline_route": {
                    "route_id": "baseline",
                    "coordinates": [{"lat": lat, "lng": lng} for lat, lng in baseline.coordinates] if baseline else [],
                    "distance": baseline.distance_km if baseline else 0,
                    "estimated_time": baseline.time_minutes if baseline else 0,
                    "cost": baseline.cost_usd if baseline else 0,
                    "co2_emissions": baseline.emissions_kg if baseline else 0,
                    "algorithm_used": baseline.algorithm_used if baseline else "none",
                    "processing_time": baseline.processing_time_ms if baseline else 0
                },
                "optimized_route": {
                    "route_id": "optimized",
                    "coordinates": [{"lat": lat, "lng": lng} for lat, lng in primary.coordinates],
                    "distance": primary.distance_km,
                    "estimated_time": primary.time_minutes,
                    "cost": primary.cost_usd,
                    "co2_emissions": primary.emissions_kg,
                    "algorithm_used": primary.algorithm_used,
                    "confidence_score": primary.confidence_score,
                    "processing_time": primary.processing_time_ms
                },
                "alternative_routes": [
                    {
                        "route_id": f"alt_{i}",
                        "coordinates": [{"lat": lat, "lng": lng} for lat, lng in alt.coordinates],
                        "distance": alt.distance_km,
                        "estimated_time": alt.time_minutes,
                        "cost": alt.cost_usd,
                        "co2_emissions": alt.emissions_kg,
                        "algorithm_used": alt.algorithm_used
                    }
                    for i, alt in enumerate(result.alternative_routes)
                ],
                "improvements": {
                    "distance_saved": result.improvements['distance_saved_km'],
                    "time_saved": result.improvements['time_saved_minutes'],
                    "cost_saved": result.improvements['cost_saved_usd'],
                    "co2_saved": result.improvements['emissions_saved_kg']
                },
                "traffic_info": result.traffic_info if hasattr(result, 'traffic_info') else {},
                "amenities": result.amenities if hasattr(result, 'amenities') else []
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

        return resp
