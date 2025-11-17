"""
SwiftRoute Trial Management Module
Handles trial subscription creation, API key generation, and expiration
"""

import secrets
import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

TRIAL_DURATION_DAYS = 14
TRIAL_REQUESTS_LIMIT = 100

async def create_trial_subscription(user_id: str, email: str, db_manager) -> Dict[str, Any]:
    """
    Create a trial subscription for a new user
    
    Args:
        user_id: User's unique identifier
        email: User's email address
        db_manager: Database manager instance
        
    Returns:
        Dict with trial subscription details including API key
    """
    try:
        # Check if user already has a subscription
        existing_sub = await db_manager.fetch_one(
            """
            SELECT id, tier, trial_end_date 
            FROM api_clients 
            WHERE user_id = %s
            """,
            (user_id,)
        )
        
        if existing_sub:
            # User already has subscription
            if existing_sub['tier'] == 'trial':
                # Check if trial expired
                if existing_sub['trial_end_date'] and existing_sub['trial_end_date'] < datetime.utcnow():
                    # Trial expired, allow regeneration
                    return await regenerate_trial_key(user_id, db_manager)
                else:
                    # Active trial exists
                    return await get_trial_details(user_id, db_manager)
            else:
                # User has paid subscription, no trial needed
                return {
                    'error': 'User already has paid subscription',
                    'tier': existing_sub['tier']
                }
        
        # Create new trial subscription
        trial_end_date = datetime.utcnow() + timedelta(days=TRIAL_DURATION_DAYS)
        
        # Insert API client
        client_id = await db_manager.fetch_one(
            """
            INSERT INTO api_clients (
                user_id,
                email,
                billing_tier,
                is_active,
                trial_end_date,
                monthly_requests_included,
                requests_used
            ) VALUES (%s, %s, 'trial', true, %s, %s, 0)
            RETURNING id
            """,
            (user_id, email, trial_end_date, TRIAL_REQUESTS_LIMIT)
        )
        
        if not client_id:
            raise Exception("Failed to create trial client")
        
        # Generate API key
        api_key = generate_api_key()
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Insert API key
        await db_manager.execute(
            """
            INSERT INTO api_keys (
                client_id,
                key_hash,
                key_prefix,
                is_active,
                expires_at
            ) VALUES (%s, %s, %s, true, %s)
            """,
            (client_id['id'], key_hash, api_key[:12], trial_end_date)
        )
        
        return {
            'success': True,
            'api_key': api_key,
            'tier': 'trial',
            'trial_end_date': trial_end_date.isoformat(),
            'requests_limit': TRIAL_REQUESTS_LIMIT,
            'requests_remaining': TRIAL_REQUESTS_LIMIT
        }
        
    except Exception as e:
        print(f"Error creating trial subscription: {e}")
        return {
            'error': str(e)
        }


async def regenerate_trial_key(user_id: str, db_manager) -> Dict[str, Any]:
    """
    Regenerate trial API key after expiration
    
    Args:
        user_id: User's unique identifier
        db_manager: Database manager instance
        
    Returns:
        Dict with new trial details
    """
    try:
        # Get client
        client = await db_manager.fetch_one(
            """
            SELECT id, tier, trial_end_date 
            FROM api_clients 
            WHERE user_id = %s AND tier = 'trial'
            """,
            (user_id,)
        )
        
        if not client:
            return {'error': 'No trial subscription found'}
        
        # Check if trial expired
        if client['trial_end_date'] >= datetime.utcnow():
            return {'error': 'Trial not yet expired'}
        
        # Extend trial period
        new_trial_end = datetime.utcnow() + timedelta(days=TRIAL_DURATION_DAYS)
        
        # Update client
        await db_manager.execute(
            """
            UPDATE api_clients 
            SET trial_end_date = %s,
                requests_used = 0,
                updated_at = NOW()
            WHERE id = %s
            """,
            (new_trial_end, client['id'])
        )
        
        # Deactivate old keys
        await db_manager.execute(
            """
            UPDATE api_keys 
            SET is_active = false 
            WHERE client_id = %s
            """,
            (client['id'],)
        )
        
        # Generate new API key
        api_key = generate_api_key()
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Insert new API key
        await db_manager.execute(
            """
            INSERT INTO api_keys (
                client_id,
                key_hash,
                key_prefix,
                is_active,
                expires_at
            ) VALUES (%s, %s, %s, true, %s)
            """,
            (client['id'], key_hash, api_key[:12], new_trial_end)
        )
        
        return {
            'success': True,
            'api_key': api_key,
            'tier': 'trial',
            'trial_end_date': new_trial_end.isoformat(),
            'requests_limit': TRIAL_REQUESTS_LIMIT,
            'requests_remaining': TRIAL_REQUESTS_LIMIT,
            'regenerated': True
        }
        
    except Exception as e:
        print(f"Error regenerating trial key: {e}")
        return {'error': str(e)}


async def upgrade_from_trial(user_id: str, new_tier: str, db_manager) -> Dict[str, Any]:
    """
    Upgrade user from trial to paid tier
    
    Args:
        user_id: User's unique identifier
        new_tier: New subscription tier (starter/professional/enterprise)
        db_manager: Database manager instance
        
    Returns:
        Dict with upgrade status
    """
    try:
        # Get client
        client = await db_manager.fetch_one(
            """
            SELECT id, tier 
            FROM api_clients 
            WHERE user_id = %s
            """,
            (user_id,)
        )
        
        if not client:
            return {'error': 'No subscription found'}
        
        if client['tier'] != 'trial':
            return {'error': 'User is not on trial tier'}
        
        # Deactivate trial API keys
        await db_manager.execute(
            """
            UPDATE api_keys 
            SET is_active = false,
                expires_at = NOW()
            WHERE client_id = %s
            """,
            (client['id'],)
        )
        
        # Update client tier
        requests_limit = {
            'starter': 1000,
            'professional': 10000,
            'enterprise': 100000
        }.get(new_tier, 1000)
        
        await db_manager.execute(
            """
            UPDATE api_clients 
            SET billing_tier = %s,
                trial_end_date = NULL,
                monthly_requests_included = %s,
                requests_used = 0,
                updated_at = NOW()
            WHERE id = %s
            """,
            (new_tier, requests_limit, client['id'])
        )
        
        # Generate new paid tier API key
        api_key = generate_api_key()
        key_hash = hashlib.sha256(api_key.encode()).hexdigest()
        
        # Insert new API key (no expiration for paid tiers)
        await db_manager.execute(
            """
            INSERT INTO api_keys (
                client_id,
                key_hash,
                key_prefix,
                is_active,
                expires_at
            ) VALUES (%s, %s, %s, true, NULL)
            """,
            (client['id'], key_hash, api_key[:12])
        )
        
        return {
            'success': True,
            'api_key': api_key,
            'tier': new_tier,
            'requests_limit': requests_limit,
            'trial_keys_deactivated': True
        }
        
    except Exception as e:
        print(f"Error upgrading from trial: {e}")
        return {'error': str(e)}


async def get_trial_details(user_id: str, db_manager) -> Dict[str, Any]:
    """
    Get trial subscription details for a user
    
    Args:
        user_id: User's unique identifier
        db_manager: Database manager instance
        
    Returns:
        Dict with trial details
    """
    try:
        # Get client and active key
        result = await db_manager.fetch_one(
            """
            SELECT 
                ac.id as client_id,
                ac.tier,
                ac.trial_end_date,
                ac.monthly_requests_included,
                ac.requests_used,
                ak.key_prefix
            FROM api_clients ac
            LEFT JOIN api_keys ak ON ac.id = ak.client_id AND ak.is_active = true
            WHERE ac.user_id = %s AND ac.tier = 'trial'
            """,
            (user_id,)
        )
        
        if not result:
            return {'error': 'No trial subscription found'}
        
        requests_remaining = result['monthly_requests_included'] - result['requests_used']
        is_expired = result['trial_end_date'] < datetime.utcnow() if result['trial_end_date'] else False
        
        return {
            'tier': 'trial',
            'trial_end_date': result['trial_end_date'].isoformat() if result['trial_end_date'] else None,
            'requests_limit': result['monthly_requests_included'],
            'requests_used': result['requests_used'],
            'requests_remaining': requests_remaining,
            'is_expired': is_expired,
            'has_active_key': bool(result['key_prefix'])
        }
        
    except Exception as e:
        print(f"Error getting trial details: {e}")
        return {'error': str(e)}


async def check_trial_expiration(user_id: str, db_manager) -> bool:
    """
    Check if user's trial has expired
    
    Args:
        user_id: User's unique identifier
        db_manager: Database manager instance
        
    Returns:
        True if expired, False otherwise
    """
    try:
        result = await db_manager.fetch_one(
            """
            SELECT trial_end_date 
            FROM api_clients 
            WHERE user_id = %s AND tier = 'trial'
            """,
            (user_id,)
        )
        
        if not result or not result['trial_end_date']:
            return False
        
        return result['trial_end_date'] < datetime.utcnow()
        
    except Exception as e:
        print(f"Error checking trial expiration: {e}")
        return False


def generate_api_key() -> str:
    """
    Generate a secure API key
    
    Returns:
        API key string with sk_ prefix
    """
    # Generate 32 bytes of random data
    random_bytes = secrets.token_bytes(32)
    # Convert to hex and add prefix
    key = f"sk_{random_bytes.hex()}"
    return key
