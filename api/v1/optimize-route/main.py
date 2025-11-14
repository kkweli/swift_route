"""
SwiftRoute FastAPI Route Optimization Service
Main FastAPI application for route optimization using GNN algorithms
"""

from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any, Tuple
import time
import uuid
import os
import asyncio
from datetime import datetime
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import our modules
from models import (
    RouteOptimizationRequest, 
    OptimizedRoute, 
    APIError, 
    HealthCheckResponse
)
from auth import validate_api_key, record_usage
from optimizer import RouteOptimizer
from database import DatabaseManager
from rate_limiter import RateLimiter, RateLimitResult

# Initialize FastAPI app
app = FastAPI(
    title="SwiftRoute Optimization API",
    description="B2B Route Optimization API powered by Graph Neural Networks",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
db_manager = DatabaseManager()
route_optimizer = RouteOptimizer(db_manager)
rate_limiter = RateLimiter(db_manager)

# Request ID middleware
@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request_id = f"req_{int(time.time() * 1000)}_{uuid.uuid4().hex[:8]}"
    request.state.request_id = request_id
    
    start_time = time.time()
    response = await call_next(request)
    process_time = int((time.time() - start_time) * 1000)
    
    response.headers["X-Request-ID"] = request_id
    response.headers["X-Process-Time"] = str(process_time)
    
    return response

# Authentication dependency
async def get_api_key(
    request: Request,
    authorization: Optional[str] = Header(None),
    x_api_key: Optional[str] = Header(None)
) -> Dict[str, Any]:
    """Extract and validate API key from headers"""
    
    # Extract API key
    api_key = None
    if authorization and authorization.startswith("Bearer "):
        api_key = authorization[7:]
    elif x_api_key:
        api_key = x_api_key
    
    if not api_key:
        raise HTTPException(
            status_code=401,
            detail={
                "error": {
                    "code": "MISSING_API_KEY",
                    "message": "API key required. Provide in Authorization header or X-API-Key header.",
                    "details": None
                },
                "request_id": getattr(request.state, 'request_id', 'unknown'),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )
    
    # Validate API key
    try:
        key_info = await validate_api_key(api_key, db_manager)
        if not key_info:
            raise HTTPException(
                status_code=401,
                detail={
                    "error": {
                        "code": "INVALID_API_KEY",
                        "message": "Invalid or expired API key",
                        "details": None
                    },
                    "request_id": getattr(request.state, 'request_id', 'unknown'),
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            )
        
        # Check rate limits
        if not key_info.get('rate_limited', False):
            rate_limit_result = await rate_limiter.check_rate_limit(
                key_info['key_id'],
                key_info['billing_tier'],
                "default"
            )
            
            # Add rate limit headers to request state for later use
            request.state.rate_limit_headers = rate_limit_result.to_headers()
            
            if not rate_limit_result.allowed:
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": {
                            "code": "RATE_LIMIT_EXCEEDED",
                            "message": f"Rate limit exceeded. Limit: {rate_limit_result.limit} requests per minute",
                            "details": {
                                "limit": rate_limit_result.limit,
                                "remaining": rate_limit_result.remaining,
                                "reset_time": rate_limit_result.reset_time,
                                "retry_after": rate_limit_result.retry_after
                            }
                        },
                        "request_id": getattr(request.state, 'request_id', 'unknown'),
                        "timestamp": datetime.utcnow().isoformat() + "Z"
                    },
                    headers=rate_limit_result.to_headers()
                )
            
            # Update key_info with current rate limit status
            key_info['requests_remaining'] = rate_limit_result.remaining
        
        return key_info
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "AUTHENTICATION_ERROR",
                    "message": "Authentication service error",
                    "details": str(e)
                },
                "request_id": getattr(request.state, 'request_id', 'unknown'),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )

# Health check endpoint (no authentication required)
@app.get("/health", response_model=Dict[str, Any])
async def health_check(request: Request):
    """Health check endpoint"""
    
    try:
        # Check database connection
        db_status = await db_manager.check_connection()
        
        # Check optimizer status
        optimizer_status = route_optimizer.get_status()
        
        health_data = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "version": "1.0.0",
            "services": {
                "database": "operational" if db_status else "degraded",
                "optimizer": optimizer_status,
                "gnn_model": "loading"  # Will be updated when GNN is implemented
            }
        }
        
        return {
            "data": health_data,
            "metadata": {
                "processing_time": 0,
                "algorithm_used": "none",
                "request_id": f"health_{int(time.time() * 1000)}"
            },
            "usage": {},
            "request_id": getattr(request.state, 'request_id', 'unknown'),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "HEALTH_CHECK_FAILED",
                    "message": "Health check failed",
                    "details": str(e)
                },
                "request_id": getattr(request.state, 'request_id', 'unknown'),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )

# Route optimization endpoint
@app.post("/optimize", response_model=Dict[str, Any])
async def optimize_route(
    request: Request,
    route_request: RouteOptimizationRequest,
    key_info: Dict[str, Any] = Depends(get_api_key)
):
    """Main route optimization endpoint"""
    
    start_time = time.time()
    request_id = getattr(request.state, 'request_id', 'unknown')
    
    try:
        # Record API usage start
        usage_start = time.time()
        
        # Validate request
        if not route_request.origin or not route_request.destination:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": {
                        "code": "INVALID_REQUEST",
                        "message": "Origin and destination coordinates are required",
                        "details": None
                    },
                    "request_id": request_id,
                    "timestamp": datetime.utcnow().isoformat() + "Z"
                }
            )
        
        # Check rate limits (basic implementation)
        # TODO: Implement proper rate limiting with Redis or database
        
        # Optimize route
        optimized_route = await route_optimizer.optimize(route_request)
        
        # Calculate processing time
        processing_time = int((time.time() - start_time) * 1000)
        
        # Record successful usage
        await record_usage(
            key_info['key_id'],
            '/optimize',
            route_request.dict(),
            processing_time,
            True,
            None,
            db_manager
        )
        
        # Prepare response
        response_data = {
            "data": optimized_route.dict(),
            "metadata": {
                "processing_time": processing_time,
                "algorithm_used": optimized_route.metadata.get('algorithm_used', 'unknown'),
                "request_id": request_id
            },
            "usage": {
                "requests_remaining": key_info.get('requests_remaining', 0),
                "billing_tier": key_info.get('billing_tier', 'unknown')
            },
            "request_id": request_id,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        # Create response with rate limit headers
        response = JSONResponse(content=response_data)
        
        # Add rate limit headers if available
        if hasattr(request.state, 'rate_limit_headers'):
            for header, value in request.state.rate_limit_headers.items():
                response.headers[header] = value
        
        return response
        
    except HTTPException:
        # Re-raise HTTP exceptions
        raise
    except Exception as e:
        # Handle unexpected errors
        processing_time = int((time.time() - start_time) * 1000)
        
        # Record failed usage
        await record_usage(
            key_info.get('key_id'),
            '/optimize',
            route_request.dict() if 'route_request' in locals() else {},
            processing_time,
            False,
            'OPTIMIZATION_ERROR',
            db_manager
        )
        
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

# Batch optimization endpoint (future feature)
@app.post("/batch-optimize", response_model=Dict[str, Any])
async def batch_optimize_routes(
    request: Request,
    batch_request: List[RouteOptimizationRequest],
    key_info: Dict[str, Any] = Depends(get_api_key)
):
    """Batch route optimization endpoint (future feature)"""
    
    raise HTTPException(
        status_code=501,
        detail={
            "error": {
                "code": "NOT_IMPLEMENTED",
                "message": "Batch optimization not yet implemented",
                "details": "This feature will be available in a future release"
            },
            "request_id": getattr(request.state, 'request_id', 'unknown'),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )

# Usage analytics endpoint
@app.get("/usage", response_model=Dict[str, Any])
async def get_usage_analytics(
    request: Request,
    hours: int = 24,
    key_info: Dict[str, Any] = Depends(get_api_key)
):
    """Get usage analytics for the authenticated API key"""
    
    try:
        usage_summary = await rate_limiter.get_usage_summary(
            key_info['key_id'],
            key_info['billing_tier'],
            hours
        )
        
        response_data = {
            "data": usage_summary,
            "metadata": {
                "processing_time": 0,
                "request_id": getattr(request.state, 'request_id', 'unknown')
            },
            "usage": {
                "requests_remaining": key_info.get('requests_remaining', 0),
                "billing_tier": key_info.get('billing_tier', 'unknown')
            },
            "request_id": getattr(request.state, 'request_id', 'unknown'),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        return response_data
        
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail={
                "error": {
                    "code": "USAGE_ANALYTICS_ERROR",
                    "message": "Failed to retrieve usage analytics",
                    "details": str(e)
                },
                "request_id": getattr(request.state, 'request_id', 'unknown'),
                "timestamp": datetime.utcnow().isoformat() + "Z"
            }
        )

# Get route details endpoint (future feature)
@app.get("/route/{route_id}", response_model=Dict[str, Any])
async def get_route_details(
    request: Request,
    route_id: str,
    key_info: Dict[str, Any] = Depends(get_api_key)
):
    """Get details of a previously optimized route (future feature)"""
    
    raise HTTPException(
        status_code=501,
        detail={
            "error": {
                "code": "NOT_IMPLEMENTED",
                "message": "Route details endpoint not yet implemented",
                "details": "This feature will be available in a future release"
            },
            "request_id": getattr(request.state, 'request_id', 'unknown'),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    """Custom HTTP exception handler"""
    return JSONResponse(
        status_code=exc.status_code,
        content=exc.detail
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    """General exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "Internal server error",
                "details": None
            },
            "request_id": getattr(request.state, 'request_id', 'unknown'),
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize services on startup"""
    print("🚀 SwiftRoute Optimization API starting up...")
    
    # Initialize database connection (non-blocking)
    try:
        await asyncio.wait_for(db_manager.initialize(), timeout=10.0)
        print("✅ Database connection initialized")
    except asyncio.TimeoutError:
        print("⚠️  Database initialization timed out, continuing with limited functionality")
    except Exception as e:
        print(f"⚠️  Database initialization failed: {e}, continuing with limited functionality")
    
    # Initialize route optimizer
    await route_optimizer.initialize()
    print("✅ Route optimizer initialized")
    
    print("🎉 SwiftRoute Optimization API ready!")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Cleanup on shutdown"""
    print("🛑 SwiftRoute Optimization API shutting down...")
    
    # Cleanup database connections
    await db_manager.cleanup()
    print("✅ Database connections closed")
    
    print("👋 SwiftRoute Optimization API stopped")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )