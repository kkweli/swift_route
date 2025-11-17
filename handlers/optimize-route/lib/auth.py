"""
SwiftRoute Authentication Module
Handles API key validation and usage tracking for the FastAPI service
"""

from typing import Optional, Dict, Any
import hashlib
import time
from datetime import datetime

async def validate_api_key(api_key: str, db_manager) -> Optional[Dict[str, Any]]:
    """
    Validate API key and return client information
    
    Args:
        api_key: The API key to validate
        db_manager: Database manager instance
        
    Returns:
        Dict with client information if valid, None if invalid
    """
    try:
        if not api_key or not api_key.startswith('sk_'):
            return None
        

        # Hash the API key for database lookup
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Query database for API key validation
        query = """
        SELECT 
            ak.id as key_id,
            ac.id as client_id,
            ac.email as client_email,
            ac.billing_tier,
            ak.is_active,
            ac.is_active as client_active
        FROM api_keys ak
        JOIN api_clients ac ON ak.client_id = ac.id
        WHERE ak.key_hash = %s
        AND ak.is_active = true
        AND ac.is_active = true
        AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
        """
        
        result = await db_manager.fetch_one(query, (key_hash,))
        
        if not result:
            return None
        
        # Check rate limits
        rate_limits = {
            'starter': {'limit': 10, 'window': 60},
            'professional': {'limit': 50, 'window': 60},
            'enterprise': {'limit': 200, 'window': 60}
        }
        
        tier_limit = rate_limits.get(result['billing_tier'], rate_limits['starter'])
        
        # Check recent usage (last minute)
        usage_query = """
        SELECT COUNT(*) as usage_count
        FROM usage_records
        WHERE api_key_id = %s
        AND created_at > NOW() - INTERVAL '1 minute'
        """
        
        usage_result = await db_manager.fetch_one(usage_query, (result['key_id'],))
        current_usage = usage_result['usage_count'] if usage_result else 0
        
        if current_usage >= tier_limit['limit']:
            # Rate limit exceeded
            return {
                'key_id': result['key_id'],
                'client_id': result['client_id'],
                'client_email': result['client_email'],
                'billing_tier': result['billing_tier'],
                'rate_limited': True,
                'requests_remaining': 0
            }
        
        return {
            'key_id': result['key_id'],
            'client_id': result['client_id'],
            'client_email': result['client_email'],
            'billing_tier': result['billing_tier'],
            'rate_limited': False,
            'requests_remaining': tier_limit['limit'] - current_usage
        }
        
    except Exception as e:
        print(f"API key validation error: {e}")
        return None

async def record_usage(
    key_id: str,
    endpoint: str,
    request_data: Dict[str, Any],
    response_time_ms: int,
    success: bool,
    error_code: Optional[str],
    db_manager
) -> bool:
    """
    Record API usage for billing and analytics
    
    Args:
        key_id: API key ID
        endpoint: API endpoint called
        request_data: Request data (will be stored as JSONB)
        response_time_ms: Response time in milliseconds
        success: Whether the request was successful
        error_code: Error code if request failed
        db_manager: Database manager instance
        
    Returns:
        True if usage was recorded successfully
    """
    try:
        query = """
        INSERT INTO usage_records (
            api_key_id,
            endpoint,
            request_data,
            response_time_ms,
            success,
            error_code,
            created_at
        ) VALUES (%s, %s, %s, %s, %s, %s, NOW())
        """
        
        await db_manager.execute(
            query,
            (key_id, endpoint, request_data, response_time_ms, success, error_code)
        )
        
        # Update last_used_at for the API key
        update_query = """
        UPDATE api_keys 
        SET last_used_at = NOW() 
        WHERE id = %s
        """
        
        await db_manager.execute(update_query, (key_id,))
        
        return True
        
    except Exception as e:
        print(f"Usage recording error: {e}")
        return False

async def check_rate_limit(
    key_id: str,
    billing_tier: str,
    db_manager
) -> Dict[str, Any]:
    """
    Check current rate limit status for an API key
    
    Args:
        key_id: API key ID
        billing_tier: Client's billing tier
        db_manager: Database manager instance
        
    Returns:
        Dict with rate limit information
    """
    try:
        rate_limits = {
            'starter': {'limit': 10, 'window': 60},
            'professional': {'limit': 50, 'window': 60},
            'enterprise': {'limit': 200, 'window': 60}
        }
        
        tier_limit = rate_limits.get(billing_tier, rate_limits['starter'])
        
        # Check usage in the current window
        query = """
        SELECT COUNT(*) as usage_count
        FROM usage_records
        WHERE api_key_id = %s
        AND created_at > NOW() - INTERVAL '%s seconds'
        """
        
        result = await db_manager.fetch_one(
            query, 
            (key_id, tier_limit['window'])
        )
        
        current_usage = result['usage_count'] if result else 0
        remaining = max(0, tier_limit['limit'] - current_usage)
        
        return {
            'allowed': current_usage < tier_limit['limit'],
            'limit': tier_limit['limit'],
            'remaining': remaining,
            'reset_time': int(time.time()) + tier_limit['window'],
            'window_seconds': tier_limit['window']
        }
        
    except Exception as e:
        print(f"Rate limit check error: {e}")
        return {
            'allowed': False,
            'limit': 0,
            'remaining': 0,
            'reset_time': int(time.time()) + 60,
            'window_seconds': 60,
            'error': str(e)
        }

async def get_client_usage_stats(
    client_id: str,
    days: int,
    db_manager
) -> Dict[str, Any]:
    """
    Get usage statistics for a client
    
    Args:
        client_id: Client ID
        days: Number of days to look back
        db_manager: Database manager instance
        
    Returns:
        Dict with usage statistics
    """
    try:
        # Get overall stats
        stats_query = """
        SELECT 
            COUNT(*) as total_requests,
            COUNT(CASE WHEN success THEN 1 END) as successful_requests,
            COUNT(CASE WHEN NOT success THEN 1 END) as failed_requests,
            AVG(response_time_ms) as avg_response_time,
            MIN(created_at) as first_request,
            MAX(created_at) as last_request
        FROM usage_records ur
        JOIN api_keys ak ON ur.api_key_id = ak.id
        WHERE ak.client_id = %s
        AND ur.created_at >= NOW() - INTERVAL '%s days'
        """
        
        stats = await db_manager.fetch_one(stats_query, (client_id, days))
        
        # Get daily breakdown
        daily_query = """
        SELECT 
            DATE(ur.created_at) as usage_date,
            COUNT(*) as requests,
            COUNT(CASE WHEN success THEN 1 END) as successful,
            AVG(response_time_ms) as avg_response_time
        FROM usage_records ur
        JOIN api_keys ak ON ur.api_key_id = ak.id
        WHERE ak.client_id = %s
        AND ur.created_at >= NOW() - INTERVAL '%s days'
        GROUP BY DATE(ur.created_at)
        ORDER BY usage_date DESC
        """
        
        daily_stats = await db_manager.fetch_all(daily_query, (client_id, days))
        
        # Get endpoint breakdown
        endpoint_query = """
        SELECT 
            ur.endpoint,
            COUNT(*) as requests,
            COUNT(CASE WHEN success THEN 1 END) as successful,
            AVG(response_time_ms) as avg_response_time
        FROM usage_records ur
        JOIN api_keys ak ON ur.api_key_id = ak.id
        WHERE ak.client_id = %s
        AND ur.created_at >= NOW() - INTERVAL '%s days'
        GROUP BY ur.endpoint
        ORDER BY requests DESC
        """
        
        endpoint_stats = await db_manager.fetch_all(endpoint_query, (client_id, days))
        
        return {
            'summary': {
                'total_requests': stats['total_requests'] or 0,
                'successful_requests': stats['successful_requests'] or 0,
                'failed_requests': stats['failed_requests'] or 0,
                'success_rate': (stats['successful_requests'] or 0) / max(stats['total_requests'] or 1, 1),
                'avg_response_time_ms': round(stats['avg_response_time'] or 0, 2),
                'first_request': stats['first_request'].isoformat() if stats['first_request'] else None,
                'last_request': stats['last_request'].isoformat() if stats['last_request'] else None,
                'period_days': days
            },
            'daily_usage': [
                {
                    'date': day['usage_date'].isoformat(),
                    'requests': day['requests'],
                    'successful': day['successful'],
                    'success_rate': day['successful'] / max(day['requests'], 1),
                    'avg_response_time_ms': round(day['avg_response_time'] or 0, 2)
                }
                for day in daily_stats
            ],
            'endpoint_usage': [
                {
                    'endpoint': endpoint['endpoint'],
                    'requests': endpoint['requests'],
                    'successful': endpoint['successful'],
                    'success_rate': endpoint['successful'] / max(endpoint['requests'], 1),
                    'avg_response_time_ms': round(endpoint['avg_response_time'] or 0, 2)
                }
                for endpoint in endpoint_stats
            ]
        }
        
    except Exception as e:
        print(f"Usage stats error: {e}")
        return {
            'summary': {
                'total_requests': 0,
                'successful_requests': 0,
                'failed_requests': 0,
                'success_rate': 0,
                'avg_response_time_ms': 0,
                'period_days': days
            },
            'daily_usage': [],
            'endpoint_usage': [],
            'error': str(e)
        }

