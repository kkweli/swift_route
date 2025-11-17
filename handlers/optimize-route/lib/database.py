"""
SwiftRoute Database Manager
Handles database connections and operations for the FastAPI service
"""

import os
import asyncio
import asyncpg
from typing import Optional, List, Dict, Any, Tuple
from contextlib import asynccontextmanager
import json

class DatabaseManager:
    """Database manager for PostgreSQL with PostGIS support"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.database_url = os.getenv('DATABASE_URL')
        
        if not self.database_url:
            raise ValueError("DATABASE_URL environment variable is required")
    
    async def initialize(self):
        """Initialize database connection pool with proxy support"""
        try:
            # Configure SSL for corporate proxy
            import ssl
            ssl_context = ssl.create_default_context()
            ssl_context.check_hostname = False
            ssl_context.verify_mode = ssl.CERT_NONE
            
            print("🌐 Configuring database connection for corporate proxy...")
            
            # Try direct connection first with timeout
            try:
                self.pool = await asyncio.wait_for(
                    asyncpg.create_pool(
                        self.database_url,
                        min_size=1,
                        max_size=5,
                        command_timeout=10,  # Short timeout for testing
                        ssl=ssl_context,
                        server_settings={
                            'application_name': 'swiftroute_optimizer',
                            'timezone': 'UTC'
                        }
                    ),
                    timeout=15.0  # 15 second timeout for pool creation
                )
                
                # Test connection
                async with self.pool.acquire() as conn:
                    result = await conn.fetchval("SELECT version()")
                    print(f"✅ Direct database connection successful")
                    print(f"📊 Connected to: {result}")
                    
                    # Check PostGIS extension
                    postgis_version = await conn.fetchval("SELECT PostGIS_Version()")
                    print(f"🗺️  PostGIS version: {postgis_version}")
                    
            except (asyncio.TimeoutError, Exception) as e:
                print(f"⚠️  Direct database connection failed: {e}")
                print("🔄 Falling back to Supabase REST API...")
                
                # Fallback to REST API
                from supabase_client import get_supabase_client
                self.rest_client = await get_supabase_client()
                self.pool = None  # No direct connection
                print("✅ Supabase REST API fallback initialized")
                
        except Exception as e:
            print(f"❌ Database initialization failed completely: {e}")
            # Don't raise - allow service to start with limited functionality
            self.pool = None
            self.rest_client = None
    
    async def cleanup(self):
        """Close database connection pool"""
        if self.pool:
            await self.pool.close()
            print("✅ Database connection pool closed")
    
    async def check_connection(self) -> bool:
        """Check if database connection is healthy"""
        try:
            if self.pool:
                async with self.pool.acquire() as conn:
                    await conn.fetchval("SELECT 1")
                    return True
            elif hasattr(self, 'rest_client') and self.rest_client:
                return await self.rest_client.test_connection()
            else:
                return False
        except:
            return False
    
    @asynccontextmanager
    async def get_connection(self):
        """Get a database connection from the pool"""
        if not self.pool:
            raise RuntimeError("Database pool not initialized")
        
        async with self.pool.acquire() as conn:
            yield conn
    
    async def execute(self, query: str, params: Tuple = ()) -> str:
        """Execute a query that doesn't return data"""
        async with self.get_connection() as conn:
            return await conn.execute(query, *params)
    
    async def fetch_one(self, query: str, params: Tuple = ()) -> Optional[Dict[str, Any]]:
        """Fetch a single row"""
        async with self.get_connection() as conn:
            row = await conn.fetchrow(query, *params)
            return dict(row) if row else None
    
    async def fetch_all(self, query: str, params: Tuple = ()) -> List[Dict[str, Any]]:
        """Fetch all rows"""
        async with self.get_connection() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    async def fetch_road_segments_in_radius(
        self, 
        lat: float, 
        lng: float, 
        radius_km: float = 10.0
    ) -> List[Dict[str, Any]]:
        """
        Fetch road segments within a radius of a point
        
        Args:
            lat: Latitude of center point
            lng: Longitude of center point
            radius_km: Radius in kilometers
            
        Returns:
            List of road segments with geometry and attributes
        """
        

        # Try direct database connection first
        if self.pool:
            query = """
            SELECT 
                id,
                osm_id,
                ST_AsGeoJSON(geometry) as geometry,
                road_type,
                speed_limit,
                distance_meters,
                source_node_id,
                target_node_id,
                traffic_weight,
                name,
                tags
            FROM road_segments
            WHERE ST_DWithin(
                geometry,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                %s
            )
            ORDER BY ST_Distance(
                geometry,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
            )
            LIMIT 5000
            """
            
            radius_meters = radius_km * 1000
            params = (lng, lat, radius_meters, lng, lat)
            
            try:
                rows = await self.fetch_all(query, params)
                
                # Parse geometry JSON
                for row in rows:
                    if row['geometry']:
                        row['geometry'] = json.loads(row['geometry'])
                    if row['tags']:
                        row['tags'] = json.loads(row['tags']) if isinstance(row['tags'], str) else row['tags']
                
                return rows
            except Exception as e:
                print(f"Direct query failed, trying REST API: {e}")
        
        # Fallback to REST API
        if hasattr(self, 'rest_client') and self.rest_client:
            try:
                return await self.rest_client.fetch_road_segments_in_radius(lat, lng, radius_km)
            except Exception as e:
                print(f"REST API fallback failed: {e}")
        
        print(f"❌ All methods failed for fetching road segments")
        return []
    
    async def fetch_nodes_in_radius(
        self, 
        lat: float, 
        lng: float, 
        radius_km: float = 10.0
    ) -> List[Dict[str, Any]]:
        """
        Fetch nodes (intersections) within a radius of a point
        
        Args:
            lat: Latitude of center point
            lng: Longitude of center point
            radius_km: Radius in kilometers
            
        Returns:
            List of nodes with coordinates and attributes
        """
        

        query = """
        SELECT 
            id,
            osm_id,
            ST_X(location::geometry) as lng,
            ST_Y(location::geometry) as lat,
            node_type,
            name,
            tags
        FROM nodes
        WHERE ST_DWithin(
            location,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
            %s
        )
        ORDER BY ST_Distance(
            location,
            ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
        )
        LIMIT 2000
        """
        
        radius_meters = radius_km * 1000
        params = (lng, lat, radius_meters, lng, lat)
        
        try:
            rows = await self.fetch_all(query, params)
            
            # Parse tags JSON
            for row in rows:
                if row['tags']:
                    row['tags'] = json.loads(row['tags']) if isinstance(row['tags'], str) else row['tags']
            
            return rows
        except Exception as e:
            print(f"Error fetching nodes: {e}")
            return []
    
    async def get_traffic_data(self, segment_ids: List[str]) -> Dict[str, Dict[str, Any]]:
        """
        Get traffic data for road segments
        
        Args:
            segment_ids: List of road segment IDs
            
        Returns:
            Dict mapping segment ID to traffic data
        """
        if not segment_ids:
            return {}
        
        query = """
        SELECT 
            road_segment_id,
            speed_kmh,
            congestion_level,
            incident_type,
            timestamp
        FROM traffic_data
        WHERE road_segment_id = ANY(%s)
        AND timestamp > NOW() - INTERVAL '1 hour'
        ORDER BY timestamp DESC
        """
        
        try:
            rows = await self.fetch_all(query, (segment_ids,))
            
            traffic_data = {}
            for row in rows:
                segment_id = row['road_segment_id']
                if segment_id not in traffic_data:
                    traffic_data[segment_id] = {
                        'speed_kmh': row['speed_kmh'],
                        'congestion_level': row['congestion_level'],
                        'incident_type': row['incident_type'],
                        'timestamp': row['timestamp'].isoformat()
                    }
            
            return traffic_data
        except Exception as e:
            print(f"Error fetching traffic data: {e}")
            return {}
    
    async def cache_route(
        self,
        origin_hash: str,
        destination_hash: str,
        vehicle_type: str,
        optimization_preference: str,
        route_data: Dict[str, Any],
        expires_minutes: int = 60
    ) -> bool:
        """
        Cache a route for performance optimization
        
        Args:
            origin_hash: Hash of origin coordinates
            destination_hash: Hash of destination coordinates
            vehicle_type: Vehicle type
            optimization_preference: Optimization preference
            route_data: Route data to cache
            expires_minutes: Cache expiration in minutes
            
        Returns:
            True if cached successfully
        """
        query = """
        INSERT INTO route_cache (
            origin_hash,
            destination_hash,
            vehicle_type,
            optimization_preference,
            route_data,
            expires_at
        ) VALUES (%s, %s, %s, %s, %s, NOW() + INTERVAL '%s minutes')
        ON CONFLICT (origin_hash, destination_hash, vehicle_type, optimization_preference)
        DO UPDATE SET
            route_data = EXCLUDED.route_data,
            expires_at = EXCLUDED.expires_at,
            created_at = NOW()
        """
        
        try:
            await self.execute(
                query,
                (origin_hash, destination_hash, vehicle_type, optimization_preference, 
                 json.dumps(route_data), expires_minutes)
            )
            return True
        except Exception as e:
            print(f"Error caching route: {e}")
            return False
    
    async def get_cached_route(
        self,
        origin_hash: str,
        destination_hash: str,
        vehicle_type: str,
        optimization_preference: str
    ) -> Optional[Dict[str, Any]]:
        """
        Get a cached route if available and not expired
        
        Args:
            origin_hash: Hash of origin coordinates
            destination_hash: Hash of destination coordinates
            vehicle_type: Vehicle type
            optimization_preference: Optimization preference
            
        Returns:
            Cached route data if available, None otherwise
        """
        query = """
        SELECT route_data, created_at
        FROM route_cache
        WHERE origin_hash = %s
        AND destination_hash = %s
        AND vehicle_type = %s
        AND optimization_preference = %s
        AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
        """
        
        try:
            result = await self.fetch_one(
                query,
                (origin_hash, destination_hash, vehicle_type, optimization_preference)
            )
            
            if result:
                route_data = result['route_data']
                if isinstance(route_data, str):
                    route_data = json.loads(route_data)
                
                # Add cache metadata
                route_data['metadata'] = route_data.get('metadata', {})
                route_data['metadata']['cached'] = True
                route_data['metadata']['cache_time'] = result['created_at'].isoformat()
                
                return route_data
            
            return None
        except Exception as e:
            print(f"Error getting cached route: {e}")
            return None
    
    async def clean_expired_cache(self) -> int:
        """
        Clean expired cache entries
        
        Returns:
            Number of entries cleaned
        """
        query = "DELETE FROM route_cache WHERE expires_at < NOW()"
        
        try:
            result = await self.execute(query)
            # Extract number from result string like "DELETE 5"
            count = int(result.split()[-1]) if result.split()[-1].isdigit() else 0
            return count
        except Exception as e:
            print(f"Error cleaning cache: {e}")
            return 0
    
    async def get_database_stats(self) -> Dict[str, Any]:
        """Get database statistics for monitoring"""
        try:
            stats = {}
            
            # Table row counts
            tables = ['api_clients', 'api_keys', 'usage_records', 'road_segments', 'nodes', 'route_cache']
            for table in tables:
                count_query = f"SELECT COUNT(*) as count FROM {table}"
                result = await self.fetch_one(count_query)
                stats[f"{table}_count"] = result['count'] if result else 0
            
            # Recent usage
            recent_usage_query = """
            SELECT COUNT(*) as recent_requests
            FROM usage_records
            WHERE created_at > NOW() - INTERVAL '1 hour'
            """
            result = await self.fetch_one(recent_usage_query)
            stats['recent_requests'] = result['recent_requests'] if result else 0
            
            # Cache hit rate (approximate)
            cache_query = """
            SELECT COUNT(*) as cached_routes
            FROM route_cache
            WHERE expires_at > NOW()
            """
            result = await self.fetch_one(cache_query)
            stats['cached_routes'] = result['cached_routes'] if result else 0
            
            return stats
        except Exception as e:
            print(f"Error getting database stats: {e}")
            return {'error': str(e)}
