"""
Configuration for route optimization engine (Vercel serverless compatible)
"""
import os
from dataclasses import dataclass, field
from typing import Dict, Optional


@dataclass
class OptimizationConfig:
    """Route optimization configuration"""
    # Algorithm selection
    algorithm: str = 'astar'  # 'astar', 'dijkstra', 'bidirectional'
    
    # Optimization weights
    distance_weight: float = 0.3
    time_weight: float = 0.4
    cost_weight: float = 0.2
    emissions_weight: float = 0.1
    
    # Performance limits (Vercel serverless constraints)
    max_execution_time_seconds: int = 8  # Leave 2s buffer from 10s limit
    max_nodes_to_explore: int = 10000
    max_route_alternatives: int = 3


@dataclass
class DatabaseConfig:
    """Database configuration"""
    supabase_url: str = field(default_factory=lambda: os.getenv('SUPABASE_URL', ''))
    supabase_key: str = field(default_factory=lambda: os.getenv('SUPABASE_SERVICE_ROLE_KEY', ''))
    
    # Query limits
    max_roads_query: int = 5000  # Limit for single query


@dataclass
class CacheConfig:
    """In-memory cache configuration (no Redis on Vercel)"""
    enable_cache: bool = True
    max_cache_size_mb: int = 100  # Stay within function memory limits
    cache_ttl_seconds: int = 300  # 5 minutes
