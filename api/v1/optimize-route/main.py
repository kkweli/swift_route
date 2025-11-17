"""
Minimal Vercel Python Handler - No FastAPI
"""
import json
from datetime import datetime
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs

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
                "version": "1.0.0-minimal",
                "services": {
                    "python": "operational",
                    "api": "operational"
                }
            },
            "metadata": {
                "processing_time": 0,
                "request_id": "health_test"
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
            
            origin = data.get('origin', [0, 0])
            destination = data.get('destination', [0, 0])
            
            # Simple mock response
            response_data = {
                "data": {
                    "baseline_route": {
                        "route_id": "baseline_test",
                        "coordinates": [
                            {"lat": origin[0], "lng": origin[1]},
                            {"lat": destination[0], "lng": destination[1]}
                        ],
                        "distance": 10.5,
                        "estimated_time": 15,
                        "cost": 5.25,
                        "co2_emissions": 1.26,
                        "algorithm_used": "dijkstra"
                    },
                    "optimized_route": {
                        "route_id": "optimized_test",
                        "coordinates": [
                            {"lat": origin[0], "lng": origin[1]},
                            {"lat": destination[0], "lng": destination[1]}
                        ],
                        "distance": 8.4,
                        "estimated_time": 12,
                        "cost": 4.20,
                        "co2_emissions": 1.01,
                        "algorithm_used": "gnn-enhanced",
                        "confidence_score": 0.95
                    },
                    "improvements": {
                        "distance_saved": 2.1,
                        "time_saved": 3,
                        "cost_saved": 1.05,
                        "co2_saved": 0.25
                    }
                },
                "metadata": {
                    "algorithm_used": "gnn-enhanced",
                    "processing_time": 50,
                    "request_id": "test_request",
                    "trial_mode": False
                },
                "usage": {
                    "requests_remaining": 95,
                    "requests_limit": 100,
                    "billing_tier": "trial"
                },
                "request_id": "test_request",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(response_data).encode())
            
        except Exception as e:
            error_response = {
                "error": {
                    "code": "OPTIMIZATION_ERROR",
                    "message": "Route optimization failed",
                    "details": str(e)
                },
                "request_id": "error_request",
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
            
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(error_response).encode())
