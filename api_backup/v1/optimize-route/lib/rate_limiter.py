"""
SwiftRoute Rate Limiting Module
Advanced rate limiting with multiple strategies and billing tier support
"""

import time
import json
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from enum import Enum

class RateLimitStrategy(str, Enum):
    """Rate limiting strategies"""
    SLIDING_WINDOW = "sliding_window"
    FIXED_WINDOW = "fixed_window"
    TOKEN_BUCKET = "token_bucket"

class RateLimitResult:
    """Rate limit check result"""
    
    def __init__(
        self,
        allowed: bool,
        limit: int,
        remaining: int,
        reset_time: int,
        retry_after: Optional[int] = None,
        strategy: str = "sliding_window"
    ):
        self.allowed = allowed
        self.limit = limit
        self.remaining = remaining
        self.reset_time = reset_time
        self.retry_after = retry_after
        self.strategy = strategy
    
    def to_headers(self) -> Dict[str, str]:
        """Convert to HTTP headers"""
        headers = {
            "X-RateLimit-Limit": str(self.limit),
            "X-RateLimit-Remaining": str(self.remaining),
            "X-RateLimit-Reset": str(self.reset_time),
            "X-RateLimit-Strategy": self.strategy
        }
        
        if self.retry_after:
            headers["Retry-After"] = str(self.retry_after)
        
        return headers

class RateLimiter:
    """Advanced rate limiter with multiple strategies"""
    
    def __init__(self, db_manager):
        self.db_manager = db_manager
        
        # Rate limit configurations by billing tier
        self.tier_configs = {
            'starter': {
                'requests_per_minute': 10,
                'requests_per_hour': 100,
                'requests_per_day': 1000,
                'burst_allowance': 5,
                'strategy': RateLimitStrategy.SLIDING_WINDOW
            },
            'professional': {
                'requests_per_minute': 50,
                'requests_per_hour': 1000,
                'requests_per_day': 10000,
                'burst_allowance': 20,
                'strategy': RateLimitStrategy.SLIDING_WINDOW
            },
            'enterprise': {
                'requests_per_minute': 200,
                'requests_per_hour': 5000,
                'requests_per_day': 50000,
                'burst_allowance': 100,
                'strategy': RateLimitStrategy.TOKEN_BUCKET
            }
        }
    
    async def check_rate_limit(
        self,
        key_id: str,
        billing_tier: str,
        endpoint: str = "default"
    ) -> RateLimitResult:
        """
        Check rate limit for an API key
        
        Args:
            key_id: API key ID
            billing_tier: Client's billing tier
            endpoint: API endpoint (for endpoint-specific limits)
            
        Returns:
            RateLimitResult with limit status
        """
        try:
            config = self.tier_configs.get(billing_tier, self.tier_configs['starter'])
            
            if config['strategy'] == RateLimitStrategy.SLIDING_WINDOW:
                return await self._check_sliding_window(key_id, config, endpoint)
            elif config['strategy'] == RateLimitStrategy.TOKEN_BUCKET:
                return await self._check_token_bucket(key_id, config, endpoint)
            else:
                return await self._check_fixed_window(key_id, config, endpoint)
                
        except Exception as e:
            print(f"Rate limit check error: {e}")
            # Fail open - allow request but with minimal limits
            return RateLimitResult(
                allowed=True,
                limit=10,
                remaining=5,
                reset_time=int(time.time()) + 60,
                strategy="error_fallback"
            )
    
    async def _check_sliding_window(
        self,
        key_id: str,
        config: Dict[str, Any],
        endpoint: str
    ) -> RateLimitResult:
        """Sliding window rate limiting"""
        
        current_time = time.time()
        window_start = current_time - 60  # 1 minute window
        
        # Count requests in the sliding window
        query = """
        SELECT COUNT(*) as request_count
        FROM usage_records
        WHERE api_key_id = %s
        AND created_at > to_timestamp(%s)
        AND endpoint = %s
        """
        
        result = await self.db_manager.fetch_one(query, (key_id, window_start, endpoint))
        current_count = result['request_count'] if result else 0
        
        limit = config['requests_per_minute']
        remaining = max(0, limit - current_count)
        allowed = current_count < limit
        
        # Calculate reset time (next minute boundary)
        reset_time = int(current_time + 60 - (current_time % 60))
        
        retry_after = None
        if not allowed:
            # Calculate when the oldest request in the window will expire
            oldest_query = """
            SELECT MIN(EXTRACT(EPOCH FROM created_at)) as oldest_time
            FROM usage_records
            WHERE api_key_id = %s
            AND created_at > to_timestamp(%s)
            AND endpoint = %s
            """
            
            oldest_result = await self.db_manager.fetch_one(
                oldest_query, (key_id, window_start, endpoint)
            )
            
            if oldest_result and oldest_result['oldest_time']:
                retry_after = int(oldest_result['oldest_time'] + 60 - current_time)
        
        return RateLimitResult(
            allowed=allowed,
            limit=limit,
            remaining=remaining,
            reset_time=reset_time,
            retry_after=retry_after,
            strategy="sliding_window"
        )
    
    async def _check_token_bucket(
        self,
        key_id: str,
        config: Dict[str, Any],
        endpoint: str
    ) -> RateLimitResult:
        """Token bucket rate limiting (for enterprise tier)"""
        
        current_time = time.time()
        bucket_key = f"bucket_{key_id}_{endpoint}"
        
        # Get or create token bucket state
        bucket_query = """
        SELECT request_data
        FROM usage_records
        WHERE api_key_id = %s
        AND endpoint = %s
        AND request_data ? 'bucket_state'
        ORDER BY created_at DESC
        LIMIT 1
        """
        
        result = await self.db_manager.fetch_one(bucket_query, (key_id, f"bucket_{endpoint}"))
        
        if result and result['request_data']:
            bucket_data = result['request_data']
            if isinstance(bucket_data, str):
                bucket_data = json.loads(bucket_data)
            
            bucket_state = bucket_data.get('bucket_state', {})
            tokens = bucket_state.get('tokens', config['requests_per_minute'])
            last_refill = bucket_state.get('last_refill', current_time)
        else:
            # Initialize bucket
            tokens = config['requests_per_minute']
            last_refill = current_time
        
        # Refill tokens based on time elapsed
        time_elapsed = current_time - last_refill
        refill_rate = config['requests_per_minute'] / 60.0  # tokens per second
        tokens_to_add = time_elapsed * refill_rate
        tokens = min(config['requests_per_minute'], tokens + tokens_to_add)
        
        # Check if request is allowed
        allowed = tokens >= 1.0
        
        if allowed:
            tokens -= 1.0
        
        # Save bucket state
        bucket_state = {
            'tokens': tokens,
            'last_refill': current_time,
            'bucket_capacity': config['requests_per_minute']
        }
        
        # Store bucket state (simplified - in production use Redis or dedicated storage)
        await self.db_manager.execute("""
            INSERT INTO usage_records (api_key_id, endpoint, request_data, success)
            VALUES (%s, %s, %s, %s)
        """, (key_id, f"bucket_{endpoint}", json.dumps({'bucket_state': bucket_state}), True))
        
        return RateLimitResult(
            allowed=allowed,
            limit=config['requests_per_minute'],
            remaining=int(tokens),
            reset_time=int(current_time + (config['requests_per_minute'] - tokens) / refill_rate),
            strategy="token_bucket"
        )
    
    async def _check_fixed_window(
        self,
        key_id: str,
        config: Dict[str, Any],
        endpoint: str
    ) -> RateLimitResult:
        """Fixed window rate limiting"""
        
        current_time = time.time()
        window_start = current_time - (current_time % 60)  # Current minute boundary
        
        # Count requests in current window
        query = """
        SELECT COUNT(*) as request_count
        FROM usage_records
        WHERE api_key_id = %s
        AND created_at >= to_timestamp(%s)
        AND created_at < to_timestamp(%s)
        AND endpoint = %s
        """
        
        result = await self.db_manager.fetch_one(
            query, (key_id, window_start, window_start + 60, endpoint)
        )
        current_count = result['request_count'] if result else 0
        
        limit = config['requests_per_minute']
        remaining = max(0, limit - current_count)
        allowed = current_count < limit
        
        reset_time = int(window_start + 60)
        retry_after = reset_time - int(current_time) if not allowed else None
        
        return RateLimitResult(
            allowed=allowed,
            limit=limit,
            remaining=remaining,
            reset_time=reset_time,
            retry_after=retry_after,
            strategy="fixed_window"
        )
    
    async def get_usage_summary(
        self,
        key_id: str,
        billing_tier: str,
        hours: int = 24
    ) -> Dict[str, Any]:
        """Get usage summary for an API key"""
        
        try:
            config = self.tier_configs.get(billing_tier, self.tier_configs['starter'])
            current_time = time.time()
            window_start = current_time - (hours * 3600)
            
            # Get usage statistics
            query = """
            SELECT 
                COUNT(*) as total_requests,
                COUNT(CASE WHEN success THEN 1 END) as successful_requests,
                COUNT(CASE WHEN NOT success THEN 1 END) as failed_requests,
                AVG(response_time_ms) as avg_response_time,
                MIN(created_at) as first_request,
                MAX(created_at) as last_request,
                endpoint,
                DATE_TRUNC('hour', created_at) as hour_bucket
            FROM usage_records
            WHERE api_key_id = %s
            AND created_at > to_timestamp(%s)
            GROUP BY endpoint, DATE_TRUNC('hour', created_at)
            ORDER BY hour_bucket DESC, total_requests DESC
            """
            
            results = await self.db_manager.fetch_all(query, (key_id, window_start))
            
            # Aggregate data
            total_requests = sum(r['total_requests'] for r in results)
            successful_requests = sum(r['successful_requests'] for r in results)
            failed_requests = sum(r['failed_requests'] for r in results)
            
            # Calculate current rate limits
            minute_limit = await self.check_rate_limit(key_id, billing_tier, "default")
            
            # Group by endpoint
            endpoint_stats = {}
            hourly_stats = {}
            
            for row in results:
                endpoint = row['endpoint']
                hour = row['hour_bucket'].isoformat()
                
                if endpoint not in endpoint_stats:
                    endpoint_stats[endpoint] = {
                        'requests': 0,
                        'successful': 0,
                        'failed': 0,
                        'avg_response_time': 0
                    }
                
                endpoint_stats[endpoint]['requests'] += row['total_requests']
                endpoint_stats[endpoint]['successful'] += row['successful_requests']
                endpoint_stats[endpoint]['failed'] += row['failed_requests']
                
                if hour not in hourly_stats:
                    hourly_stats[hour] = {
                        'requests': 0,
                        'successful': 0,
                        'failed': 0
                    }
                
                hourly_stats[hour]['requests'] += row['total_requests']
                hourly_stats[hour]['successful'] += row['successful_requests']
                hourly_stats[hour]['failed'] += row['failed_requests']
            
            return {
                'summary': {
                    'total_requests': total_requests,
                    'successful_requests': successful_requests,
                    'failed_requests': failed_requests,
                    'success_rate': successful_requests / max(total_requests, 1),
                    'period_hours': hours
                },
                'current_limits': {
                    'requests_per_minute': config['requests_per_minute'],
                    'requests_per_hour': config['requests_per_hour'],
                    'requests_per_day': config['requests_per_day'],
                    'current_remaining': minute_limit.remaining,
                    'reset_time': minute_limit.reset_time
                },
                'endpoint_breakdown': endpoint_stats,
                'hourly_breakdown': hourly_stats,
                'billing_tier': billing_tier,
                'tier_config': config
            }
            
        except Exception as e:
            print(f"Usage summary error: {e}")
            return {
                'summary': {'error': str(e)},
                'current_limits': {},
                'endpoint_breakdown': {},
                'hourly_breakdown': {}
            }
    
    async def cleanup_old_usage_records(self, days_to_keep: int = 30) -> int:
        """Clean up old usage records to manage database size"""
        
        try:
            cutoff_time = time.time() - (days_to_keep * 24 * 3600)
            
            query = """
            DELETE FROM usage_records
            WHERE created_at < to_timestamp(%s)
            AND endpoint NOT LIKE 'bucket_%'
            """
            
            result = await self.db_manager.execute(query, (cutoff_time,))
            
            # Extract count from result
            count = int(result.split()[-1]) if result.split()[-1].isdigit() else 0
            
            print(f"Cleaned up {count} old usage records")
            return count
            
        except Exception as e:
            print(f"Cleanup error: {e}")
            return 0
    
    async def get_rate_limit_violations(
        self,
        hours: int = 24,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get recent rate limit violations for monitoring"""
        
        try:
            window_start = time.time() - (hours * 3600)
            
            # Find API keys with high request rates
            query = """
            SELECT 
                ur.api_key_id,
                ac.email,
                ac.billing_tier,
                COUNT(*) as request_count,
                COUNT(CASE WHEN NOT ur.success THEN 1 END) as failed_count,
                MAX(ur.created_at) as last_request
            FROM usage_records ur
            JOIN api_keys ak ON ur.api_key_id = ak.id
            JOIN api_clients ac ON ak.client_id = ac.id
            WHERE ur.created_at > to_timestamp(%s)
            GROUP BY ur.api_key_id, ac.email, ac.billing_tier
            HAVING COUNT(*) > %s
            ORDER BY request_count DESC
            LIMIT 50
            """
            
            results = await self.db_manager.fetch_all(query, (window_start, limit))
            
            violations = []
            for row in results:
                config = self.tier_configs.get(row['billing_tier'], self.tier_configs['starter'])
                expected_max = config['requests_per_hour'] * (hours / 24)
                
                if row['request_count'] > expected_max:
                    violations.append({
                        'api_key_id': row['api_key_id'],
                        'client_email': row['email'],
                        'billing_tier': row['billing_tier'],
                        'request_count': row['request_count'],
                        'failed_count': row['failed_count'],
                        'expected_max': int(expected_max),
                        'violation_ratio': row['request_count'] / expected_max,
                        'last_request': row['last_request'].isoformat()
                    })
            
            return violations
            
        except Exception as e:
            print(f"Rate limit violations check error: {e}")
            return []