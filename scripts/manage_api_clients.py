#!/usr/bin/env python3
"""
SwiftRoute API Client Management Script
Create, manage, and monitor API clients and keys
"""

import os
import sys
import asyncio
import argparse
import json
from datetime import datetime, timedelta

# Add current directory to path for imports
sys.path.append(os.path.dirname(__file__))

from db_config import get_database_connection, get_supabase_config

class APIClientManager:
    """Manage API clients and keys"""
    
    def __init__(self):
        self.conn = None
    
    def get_connection(self):
        """Get database connection"""
        if not self.conn:
            self.conn = get_database_connection()
        return self.conn
    
    def cleanup(self):
        """Cleanup database connection"""
        if self.conn:
            self.conn.close()
            self.conn = None
    
    async def create_client(self, email: str, company_name: str, billing_tier: str = 'starter'):
        """Create a new API client"""
        
        valid_tiers = ['starter', 'professional', 'enterprise']
        if billing_tier not in valid_tiers:
            print(f"❌ Invalid billing tier. Must be one of: {', '.join(valid_tiers)}")
            return None
        
        try:
            # Check if client already exists
            existing_query = "SELECT id FROM api_clients WHERE email = %s"
            existing = await self.db_manager.fetch_one(existing_query, (email,))
            
            if existing:
                print(f"❌ Client with email {email} already exists")
                return None
            
            # Create client
            client_query = """
            INSERT INTO api_clients (email, company_name, billing_tier)
            VALUES (%s, %s, %s)
            RETURNING id
            """
            
            result = await self.db_manager.fetch_one(
                client_query, (email, company_name, billing_tier)
            )
            
            if result:
                client_id = result['id']
                print(f"✅ Created client: {email} ({company_name}) - {billing_tier}")
                print(f"   Client ID: {client_id}")
                return client_id
            else:
                print("❌ Failed to create client")
                return None
                
        except Exception as e:
            print(f"❌ Error creating client: {e}")
            return None
    
    async def create_api_key(self, client_email: str, key_name: str = "Default API Key"):
        """Create an API key for a client"""
        
        try:
            # Get client ID
            client_query = "SELECT id FROM api_clients WHERE email = %s AND is_active = true"
            client_result = await self.db_manager.fetch_one(client_query, (client_email,))
            
            if not client_result:
                print(f"❌ Client {client_email} not found or inactive")
                return None
            
            client_id = client_result['id']
            
            # Generate API key using database function
            key_query = "SELECT generate_api_key() as api_key"
            key_result = await self.db_manager.fetch_one(key_query)
            
            if not key_result:
                print("❌ Failed to generate API key")
                return None
            
            api_key = key_result['api_key']
            
            # Hash the key
            hash_query = "SELECT hash_api_key(%s) as key_hash"
            hash_result = await self.db_manager.fetch_one(hash_query, (api_key,))
            key_hash = hash_result['key_hash']
            
            # Store the key
            store_query = """
            INSERT INTO api_keys (client_id, key_hash, key_name)
            VALUES (%s, %s, %s)
            RETURNING id
            """
            
            store_result = await self.db_manager.fetch_one(
                store_query, (client_id, key_hash, key_name)
            )
            
            if store_result:
                key_id = store_result['id']
                print(f"✅ Created API key for {client_email}")
                print(f"   Key Name: {key_name}")
                print(f"   Key ID: {key_id}")
                print(f"   API Key: {api_key}")
                print("   ⚠️  Save this key - it won't be shown again!")
                return api_key
            else:
                print("❌ Failed to store API key")
                return None
                
        except Exception as e:
            print(f"❌ Error creating API key: {e}")
            return None
    
    async def list_clients(self, active_only: bool = True):
        """List all API clients"""
        
        try:
            where_clause = "WHERE is_active = true" if active_only else ""
            query = f"""
            SELECT 
                ac.id,
                ac.email,
                ac.company_name,
                ac.billing_tier,
                ac.is_active,
                ac.created_at,
                COUNT(ak.id) as api_key_count,
                MAX(ak.last_used_at) as last_api_usage
            FROM api_clients ac
            LEFT JOIN api_keys ak ON ac.id = ak.client_id AND ak.is_active = true
            {where_clause}
            GROUP BY ac.id, ac.email, ac.company_name, ac.billing_tier, ac.is_active, ac.created_at
            ORDER BY ac.created_at DESC
            """
            
            clients = await self.db_manager.fetch_all(query)
            
            if not clients:
                print("No clients found")
                return
            
            print(f"\n📋 API Clients ({'Active only' if active_only else 'All'}):")
            print("=" * 80)
            
            for client in clients:
                status = "✅" if client['is_active'] else "❌"
                last_usage = client['last_api_usage'].strftime('%Y-%m-%d %H:%M') if client['last_api_usage'] else 'Never'
                
                print(f"{status} {client['email']}")
                print(f"   Company: {client['company_name']}")
                print(f"   Tier: {client['billing_tier']}")
                print(f"   API Keys: {client['api_key_count']}")
                print(f"   Last Usage: {last_usage}")
                print(f"   Created: {client['created_at'].strftime('%Y-%m-%d %H:%M')}")
                print()
                
        except Exception as e:
            print(f"❌ Error listing clients: {e}")
    
    async def list_api_keys(self, client_email: str):
        """List API keys for a client"""
        
        try:
            query = """
            SELECT 
                ak.id,
                ak.key_name,
                ak.is_active,
                ak.last_used_at,
                ak.expires_at,
                ak.created_at,
                ac.email,
                ac.billing_tier
            FROM api_keys ak
            JOIN api_clients ac ON ak.client_id = ac.id
            WHERE ac.email = %s
            ORDER BY ak.created_at DESC
            """
            
            keys = await self.db_manager.fetch_all(query, (client_email,))
            
            if not keys:
                print(f"No API keys found for {client_email}")
                return
            
            print(f"\n🔑 API Keys for {client_email}:")
            print("=" * 60)
            
            for key in keys:
                status = "✅" if key['is_active'] else "❌"
                last_used = key['last_used_at'].strftime('%Y-%m-%d %H:%M') if key['last_used_at'] else 'Never'
                expires = key['expires_at'].strftime('%Y-%m-%d %H:%M') if key['expires_at'] else 'Never'
                
                print(f"{status} {key['key_name']}")
                print(f"   Key ID: {key['id']}")
                print(f"   Last Used: {last_used}")
                print(f"   Expires: {expires}")
                print(f"   Created: {key['created_at'].strftime('%Y-%m-%d %H:%M')}")
                print()
                
        except Exception as e:
            print(f"❌ Error listing API keys: {e}")
    
    async def get_usage_stats(self, client_email: str, days: int = 7):
        """Get usage statistics for a client"""
        
        try:
            query = """
            SELECT 
                COUNT(*) as total_requests,
                COUNT(CASE WHEN ur.success THEN 1 END) as successful_requests,
                COUNT(CASE WHEN NOT ur.success THEN 1 END) as failed_requests,
                AVG(ur.response_time_ms) as avg_response_time,
                ur.endpoint,
                DATE(ur.created_at) as usage_date
            FROM usage_records ur
            JOIN api_keys ak ON ur.api_key_id = ak.id
            JOIN api_clients ac ON ak.client_id = ac.id
            WHERE ac.email = %s
            AND ur.created_at >= NOW() - INTERVAL '%s days'
            GROUP BY ur.endpoint, DATE(ur.created_at)
            ORDER BY usage_date DESC, total_requests DESC
            """
            
            stats = await self.db_manager.fetch_all(query, (client_email, days))
            
            if not stats:
                print(f"No usage data found for {client_email} in the last {days} days")
                return
            
            # Aggregate totals
            total_requests = sum(s['total_requests'] for s in stats)
            total_successful = sum(s['successful_requests'] for s in stats)
            total_failed = sum(s['failed_requests'] for s in stats)
            
            print(f"\n📊 Usage Statistics for {client_email} (Last {days} days):")
            print("=" * 70)
            print(f"Total Requests: {total_requests}")
            print(f"Successful: {total_successful} ({total_successful/max(total_requests,1)*100:.1f}%)")
            print(f"Failed: {total_failed} ({total_failed/max(total_requests,1)*100:.1f}%)")
            print()
            
            # Daily breakdown
            daily_stats = {}
            for stat in stats:
                date = stat['usage_date']
                if date not in daily_stats:
                    daily_stats[date] = {'requests': 0, 'successful': 0, 'failed': 0}
                
                daily_stats[date]['requests'] += stat['total_requests']
                daily_stats[date]['successful'] += stat['successful_requests']
                daily_stats[date]['failed'] += stat['failed_requests']
            
            print("Daily Breakdown:")
            for date in sorted(daily_stats.keys(), reverse=True):
                day_stats = daily_stats[date]
                success_rate = day_stats['successful'] / max(day_stats['requests'], 1) * 100
                print(f"  {date}: {day_stats['requests']} requests ({success_rate:.1f}% success)")
            
        except Exception as e:
            print(f"❌ Error getting usage stats: {e}")
    
    async def deactivate_client(self, client_email: str):
        """Deactivate a client and all their API keys"""
        
        try:
            # Deactivate client
            client_query = """
            UPDATE api_clients 
            SET is_active = false 
            WHERE email = %s 
            RETURNING id
            """
            
            result = await self.db_manager.fetch_one(client_query, (client_email,))
            
            if not result:
                print(f"❌ Client {client_email} not found")
                return False
            
            client_id = result['id']
            
            # Deactivate all API keys
            keys_query = """
            UPDATE api_keys 
            SET is_active = false 
            WHERE client_id = %s
            """
            
            await self.db_manager.execute(keys_query, (client_id,))
            
            print(f"✅ Deactivated client {client_email} and all associated API keys")
            return True
            
        except Exception as e:
            print(f"❌ Error deactivating client: {e}")
            return False
    
    async def cleanup_old_usage(self, days: int = 30):
        """Clean up old usage records"""
        
        try:
            cutoff_date = datetime.now() - timedelta(days=days)
            
            query = """
            DELETE FROM usage_records 
            WHERE created_at < %s
            AND endpoint NOT LIKE 'bucket_%'
            """
            
            result = await self.db_manager.execute(query, (cutoff_date,))
            count = int(result.split()[-1]) if result.split()[-1].isdigit() else 0
            
            print(f"✅ Cleaned up {count} usage records older than {days} days")
            return count
            
        except Exception as e:
            print(f"❌ Error cleaning up usage records: {e}")
            return 0

async def main():
    """Main function"""
    
    parser = argparse.ArgumentParser(description='SwiftRoute API Client Management')
    subparsers = parser.add_subparsers(dest='command', help='Available commands')
    
    # Create client command
    create_client_parser = subparsers.add_parser('create-client', help='Create a new API client')
    create_client_parser.add_argument('email', help='Client email address')
    create_client_parser.add_argument('company', help='Company name')
    create_client_parser.add_argument('--tier', choices=['starter', 'professional', 'enterprise'], 
                                    default='starter', help='Billing tier')
    
    # Create API key command
    create_key_parser = subparsers.add_parser('create-key', help='Create an API key')
    create_key_parser.add_argument('email', help='Client email address')
    create_key_parser.add_argument('--name', default='API Key', help='Key name')
    
    # List clients command
    list_clients_parser = subparsers.add_parser('list-clients', help='List API clients')
    list_clients_parser.add_argument('--all', action='store_true', help='Include inactive clients')
    
    # List keys command
    list_keys_parser = subparsers.add_parser('list-keys', help='List API keys for a client')
    list_keys_parser.add_argument('email', help='Client email address')
    
    # Usage stats command
    usage_parser = subparsers.add_parser('usage', help='Get usage statistics')
    usage_parser.add_argument('email', help='Client email address')
    usage_parser.add_argument('--days', type=int, default=7, help='Number of days to analyze')
    
    # Deactivate client command
    deactivate_parser = subparsers.add_parser('deactivate', help='Deactivate a client')
    deactivate_parser.add_argument('email', help='Client email address')
    
    # Cleanup command
    cleanup_parser = subparsers.add_parser('cleanup', help='Clean up old usage records')
    cleanup_parser.add_argument('--days', type=int, default=30, help='Keep records newer than this many days')
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    manager = APIClientManager()
    
    try:
        await manager.initialize()
        
        if args.command == 'create-client':
            await manager.create_client(args.email, args.company, args.tier)
        
        elif args.command == 'create-key':
            await manager.create_api_key(args.email, args.name)
        
        elif args.command == 'list-clients':
            await manager.list_clients(active_only=not args.all)
        
        elif args.command == 'list-keys':
            await manager.list_api_keys(args.email)
        
        elif args.command == 'usage':
            await manager.get_usage_stats(args.email, args.days)
        
        elif args.command == 'deactivate':
            await manager.deactivate_client(args.email)
        
        elif args.command == 'cleanup':
            await manager.cleanup_old_usage(args.days)
        
    finally:
        await manager.cleanup()

if __name__ == "__main__":
    asyncio.run(main())