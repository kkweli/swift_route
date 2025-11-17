"""
Minimal Vercel Python Handler - No FastAPI
"""
import json
from datetime import datetime

def handler(request):
    """Vercel serverless function handler"""
    
    # Handle CORS preflight
    if request.get('method') == 'OPTIONS':
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization, X-API-Key"
            },
            "body": ""
        }
    
    # Get the path
    path = request.get('path', '')
    
    # Health check
    if 'health' in path or request.get('method') == 'GET':
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
        
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps(response_data)
        }
    
    # Optimize endpoint
    if request.get('method') == 'POST':
        try:
            # Parse request body
            body = request.get('body', '{}')
            if isinstance(body, str):
                data = json.loads(body)
            else:
                data = body
            
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
            
            return {
                "statusCode": 200,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps(response_data)
            }
            
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
            
            return {
                "statusCode": 500,
                "headers": {
                    "Content-Type": "application/json",
                    "Access-Control-Allow-Origin": "*"
                },
                "body": json.dumps(error_response)
            }
    
    # Method not allowed
    return {
        "statusCode": 405,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": json.dumps({
            "error": {
                "code": "METHOD_NOT_ALLOWED",
                "message": f"Method {request.get('method')} not allowed"
            }
        })
    }
