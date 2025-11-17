"""
In-memory caching system for Vercel serverless
Uses LRU (Least Recently Used) eviction policy
"""
import time
import hashlib
import pickle
from typing import Any, Optional, Dict, Tuple
from functools import lru_cache
from collections import OrderedDict
import sys


class GraphCache:
    """
    In-memory cache for NetworkX graphs
    Optimized for Vercel serverless constraints
    """
    
    def __init__(self, max_size_mb: int = 100, ttl_seconds: int = 300):
        """
        Initialize cache
        
        Args:
            max_size_mb: Maximum cache size in megabytes
            ttl_seconds: Time-to-live for cached items (default 5 minutes)
        """
        self.max_size_bytes = max_size_mb * 1024 * 1024
        self.ttl_seconds = ttl_seconds
        self._cache: OrderedDict[str, Tuple[Any, float, int]] = OrderedDict()
        self._current_size_bytes = 0
    
    def _generate_key(self, *args, **kwargs) -> str:
        """Generate cache key from arguments"""
        key_data = str(args) + str(sorted(kwargs.items()))
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def _get_size(self, obj: Any) -> int:
        """Estimate object size in bytes"""
        try:
            return sys.getsizeof(pickle.dumps(obj))
        except:
            return sys.getsizeof(obj)
    
    def _evict_if_needed(self, new_item_size: int):
        """Evict old items if cache is full"""
        while (self._current_size_bytes + new_item_size > self.max_size_bytes 
               and len(self._cache) > 0):
            # Remove oldest item (FIFO within LRU)
            oldest_key = next(iter(self._cache))
            _, _, size = self._cache.pop(oldest_key)
            self._current_size_bytes -= size
    
    def _is_expired(self, timestamp: float) -> bool:
        """Check if cached item is expired"""
        return time.time() - timestamp > self.ttl_seconds
    
    def get(self, key: str) -> Optional[Any]:
        """
        Get item from cache
        
        Args:
            key: Cache key
        
        Returns:
            Cached value or None if not found/expired
        """
        if key not in self._cache:
            return None
        
        value, timestamp, size = self._cache[key]
        
        # Check expiration
        if self._is_expired(timestamp):
            self._cache.pop(key)
            self._current_size_bytes -= size
            return None
        
        # Move to end (mark as recently used)
        self._cache.move_to_end(key)
        
        return value
    
    def set(self, key: str, value: Any):
        """
        Set item in cache
        
        Args:
            key: Cache key
            value: Value to cache
        """
        # Calculate size
        size = self._get_size(value)
        
        # Remove old entry if exists
        if key in self._cache:
            _, _, old_size = self._cache.pop(key)
            self._current_size_bytes -= old_size
        
        # Evict if needed
        self._evict_if_needed(size)
        
        # Add new entry
        self._cache[key] = (value, time.time(), size)
        self._current_size_bytes += size
    
    def clear(self):
        """Clear all cached items"""
        self._cache.clear()
        self._current_size_bytes = 0
    
    def get_stats(self) -> Dict[str, Any]:
        """Get cache statistics"""
        return {
            'items': len(self._cache),
            'size_mb': round(self._current_size_bytes / (1024 * 1024), 2),
            'max_size_mb': self.max_size_bytes / (1024 * 1024),
            'utilization': round(self._current_size_bytes / self.max_size_bytes * 100, 1)
        }


# Global cache instance
_graph_cache = GraphCache(max_size_mb=100, ttl_seconds=300)


def cached_graph(func):
    """
    Decorator for caching graph operations
    
    Usage:
        @cached_graph
        def load_graph(bbox):
            # expensive operation
            return graph
    """
    def wrapper(*args, **kwargs):
        # Generate cache key
        cache_key = _graph_cache._generate_key(func.__name__, *args, **kwargs)
        
        # Try to get from cache
        cached_result = _graph_cache.get(cache_key)
        if cached_result is not None:
            return cached_result
        
        # Execute function
        result = func(*args, **kwargs)
        
        # Cache result
        _graph_cache.set(cache_key, result)
        
        return result
    
    return wrapper


def get_cache_stats() -> Dict[str, Any]:
    """Get global cache statistics"""
    return _graph_cache.get_stats()


def clear_cache():
    """Clear global cache"""
    _graph_cache.clear()


# Route result caching
class RouteCache:
    """Cache for computed routes"""
    
    def __init__(self, max_items: int = 1000, ttl_seconds: int = 600):
        """
        Initialize route cache
        
        Args:
            max_items: Maximum number of routes to cache
            ttl_seconds: Time-to-live (default 10 minutes)
        """
        self.max_items = max_items
        self.ttl_seconds = ttl_seconds
        self._cache: OrderedDict[str, Tuple[Any, float]] = OrderedDict()
    
    def _generate_route_key(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        vehicle_type: str,
        optimization: str
    ) -> str:
        """Generate cache key for route"""
        key_data = f"{origin}_{destination}_{vehicle_type}_{optimization}"
        return hashlib.md5(key_data.encode()).hexdigest()
    
    def get_route(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        vehicle_type: str = 'car',
        optimization: str = 'time'
    ) -> Optional[Dict]:
        """Get cached route"""
        key = self._generate_route_key(origin, destination, vehicle_type, optimization)
        
        if key not in self._cache:
            return None
        
        route, timestamp = self._cache[key]
        
        # Check expiration
        if time.time() - timestamp > self.ttl_seconds:
            self._cache.pop(key)
            return None
        
        # Move to end (LRU)
        self._cache.move_to_end(key)
        
        return route
    
    def set_route(
        self,
        origin: Tuple[float, float],
        destination: Tuple[float, float],
        vehicle_type: str,
        optimization: str,
        route: Dict
    ):
        """Cache a route"""
        key = self._generate_route_key(origin, destination, vehicle_type, optimization)
        
        # Remove oldest if at capacity
        if len(self._cache) >= self.max_items and key not in self._cache:
            self._cache.popitem(last=False)
        
        self._cache[key] = (route, time.time())
    
    def clear(self):
        """Clear route cache"""
        self._cache.clear()


# Global route cache
_route_cache = RouteCache(max_items=1000, ttl_seconds=600)


def get_cached_route(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    vehicle_type: str = 'car',
    optimization: str = 'time'
) -> Optional[Dict]:
    """Get cached route result"""
    return _route_cache.get_route(origin, destination, vehicle_type, optimization)


def cache_route(
    origin: Tuple[float, float],
    destination: Tuple[float, float],
    vehicle_type: str,
    optimization: str,
    route: Dict
):
    """Cache a route result"""
    _route_cache.set_route(origin, destination, vehicle_type, optimization, route)


def clear_route_cache():
    """Clear route cache"""
    _route_cache.clear()
