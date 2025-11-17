"""
Cache warming utilities
Pre-load frequently accessed data
"""
import time
from typing import Optional, Tuple
from ..network.loader import RoadNetworkLoader
from ..network.graph import GraphUtils
from .cache import cached_graph, get_cache_stats


class CacheWarmer:
    """Warm up cache with frequently accessed data"""
    
    def __init__(self, loader: RoadNetworkLoader):
        """
        Initialize cache warmer
        
        Args:
            loader: Road network loader instance
        """
        self.loader = loader
    
    def warm_nairobi_network(self) -> dict:
        """
        Pre-load Nairobi road network into cache
        
        Returns:
            Statistics about warming operation
        """
        start_time = time.time()
        
        print("Warming cache with Nairobi road network...")
        
        # Load full network
        graph = self.loader.build_graph()
        
        # Add weights
        graph = GraphUtils.add_weights_to_graph(graph)
        
        elapsed = time.time() - start_time
        
        stats = {
            'nodes': graph.number_of_nodes(),
            'edges': graph.number_of_edges(),
            'load_time_seconds': round(elapsed, 2),
            'cache_stats': get_cache_stats()
        }
        
        print(f"✓ Loaded {stats['nodes']} nodes and {stats['edges']} edges in {stats['load_time_seconds']}s")
        
        return stats
    
    def warm_popular_routes(self, routes: list[Tuple[Tuple[float, float], Tuple[float, float]]]):
        """
        Pre-compute popular routes
        
        Args:
            routes: List of (origin, destination) tuples
        """
        print(f"Warming cache with {len(routes)} popular routes...")
        
        # This would pre-compute routes
        # Implementation depends on having the optimizer ready
        pass


def warm_cache_on_startup():
    """
    Warm cache when service starts
    Call this in main.py initialization
    """
    try:
        loader = RoadNetworkLoader()
        warmer = CacheWarmer(loader)
        stats = warmer.warm_nairobi_network()
        return stats
    except Exception as e:
        print(f"Cache warming failed: {e}")
        return None
