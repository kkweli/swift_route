"""
Supabase REST API Client for Corporate Proxy Environments
Fallback when direct database connections are blocked
"""

import os
import json
import aiohttp
import asyncio
from typing import Optional, List, Dict, Any
from urllib.parse import urljoin

class SupabaseRestClient:
    """Supabase REST API client that works through corporate proxies"""
    
    def __init__(self):
        self.base_url = os.getenv('SUPABASE_URL')
        self.api_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')
        
        if not self.base_url or not self.api_key:
            raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required")
        
        self.rest_url = urljoin(self.base_url, '/rest/v1/')
        
        # Configure proxy settings
        self.proxy_url = os.getenv('HTTP_PROXY') or os.getenv('http_proxy')
        
        # Headers for API requests
        self.headers = {
            'apikey': self.api_key,
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json',
            'Prefer': 'return=representation'
        }
    
    async def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        data: Optional[Dict] = None,
        params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """Make HTTP request to Supabase REST API"""
        
        url = urljoin(self.rest_url, endpoint)
        
        # Configure SSL and proxy settings for corporate environment
        connector = aiohttp.TCPConnector(
            ssl=False,  # Disable SSL verification for corporate proxy
            limit=10,
            limit_per_host=5
        )
        
        timeout = aiohttp.ClientTimeout(total=30)
        
        try:
            async with aiohttp.ClientSession(
                connector=connector,
                timeout=timeout,
                headers=self.headers
            ) as session:
                
                # Configure proxy if available
                proxy = self.proxy_url if self.proxy_url else None
                
                async with session.request(
                    method=method,
                    url=url,
                    json=data,
                    params=params,
                    proxy=proxy
                ) as response:
                    
                    if response.status >= 400:
                        error_text = await response.text()
                        print(f"❌ Supabase API error {response.status}: {error_text}")
                        return None
                    
                    return await response.json()
                    
        except Exception as e:
            print(f"❌ Request failed: {e}")
            return None
    
    async def test_connection(self) -> bool:
        """Test connection to Supabase REST API"""
        try:
            result = await self._make_request('GET', 'road_segments?limit=1')
            return result is not None
        except Exception as e:
            print(f"❌ Connection test failed: {e}")
            return False
    
    async def fetch_road_segments_in_radius(
        self, 
        lat: float, 
        lng: float, 
        radius_km: float = 10.0
    ) -> List[Dict[str, Any]]:
        """
        Fetch road segments within a radius using PostgREST
        """
        
        # Use PostgREST RPC function for spatial queries
        endpoint = 'rpc/get_road_segments_in_radius'
        data = {
            'center_lat': lat,
            'center_lng': lng,
            'radius_km': radius_km
        }
        
        try:
            result = await self._make_request('POST', endpoint, data)
            return result if result else []
        except Exception as e:
            print(f"❌ Error fetching road segments: {e}")
            return []
    
    async def fetch_nodes_in_radius(
        self, 
        lat: float, 
        lng: float, 
        radius_km: float = 10.0
    ) -> List[Dict[str, Any]]:
        """
        Fetch nodes within a radius using PostgREST
        """
        
        endpoint = 'rpc/get_nodes_in_radius'
        data = {
            'center_lat': lat,
            'center_lng': lng,
            'radius_km': radius_km
        }
        
        try:
            result = await self._make_request('POST', endpoint, data)
            return result if result else []
        except Exception as e:
            print(f"❌ Error fetching nodes: {e}")
            return []
    
    async def cache_route(
        self,
        origin_hash: str,
        destination_hash: str,
        vehicle_type: str,
        optimization_preference: str,
        route_data: Dict[str, Any],
        expires_minutes: int = 60
    ) -> bool:
        """Cache a route using REST API"""
        
        endpoint = 'route_cache'
        data = {
            'origin_hash': origin_hash,
            'destination_hash': destination_hash,
            'vehicle_type': vehicle_type,
            'optimization_preference': optimization_preference,
            'route_data': route_data,
            'expires_at': f'now() + interval \'{expires_minutes} minutes\''
        }
        
        try:
            result = await self._make_request('POST', endpoint, data)
            return result is not None
        except Exception as e:
            print(f"❌ Error caching route: {e}")
            return False
    
    async def get_cached_route(
        self,
        origin_hash: str,
        destination_hash: str,
        vehicle_type: str,
        optimization_preference: str
    ) -> Optional[Dict[str, Any]]:
        """Get cached route using REST API"""
        
        endpoint = 'route_cache'
        params = {
            'origin_hash': f'eq.{origin_hash}',
            'destination_hash': f'eq.{destination_hash}',
            'vehicle_type': f'eq.{vehicle_type}',
            'optimization_preference': f'eq.{optimization_preference}',
            'expires_at': f'gt.now()',
            'order': 'created_at.desc',
            'limit': 1
        }
        
        try:
            result = await self._make_request('GET', endpoint, params=params)
            if result and len(result) > 0:
                cached_data = result[0]
                route_data = cached_data['route_data']
                
                # Add cache metadata
                if 'metadata' not in route_data:
                    route_data['metadata'] = {}
                route_data['metadata']['cached'] = True
                route_data['metadata']['cache_time'] = cached_data['created_at']
                
                return route_data
            
            return None
        except Exception as e:
            print(f"❌ Error getting cached route: {e}")
            return None
    
    async def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics using REST API"""
        
        try:
            stats = {}
            
            # Get table counts
            tables = ['api_clients', 'api_keys', 'usage_records', 'road_segments', 'nodes']
            
            for table in tables:
                endpoint = table
                params = {'select': 'count'}
                result = await self._make_request('GET', endpoint, params=params)
                
                if result:
                    stats[f"{table}_count"] = len(result)
                else:
                    stats[f"{table}_count"] = 0
            
            return stats
            
        except Exception as e:
            print(f"❌ Error getting database stats: {e}")
            return {'error': str(e)}

# Global instance
supabase_rest_client = None

async def get_supabase_client() -> SupabaseRestClient:
    """Get or create Supabase REST client"""
    global supabase_rest_client
    
    if supabase_rest_client is None:
        supabase_rest_client = SupabaseRestClient()
        
        # Test connection
        if await supabase_rest_client.test_connection():
            print("✅ Supabase REST API connection successful")
        else:
            print("❌ Supabase REST API connection failed")
    
    return supabase_rest_client