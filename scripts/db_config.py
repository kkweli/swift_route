#!/usr/bin/env python3
"""
Shared database configuration for SwiftRoute Python scripts
Uses the same Supabase environment variables as the React app
"""

import os
import sys
from dotenv import load_dotenv
import psycopg2
from psycopg2.extras import RealDictCursor

# Load environment variables from .env file
load_dotenv()

def get_supabase_config():
    """Get Supabase configuration from environment variables"""
    config = {
        'url': os.getenv('SUPABASE_URL'),
        'anon_key': os.getenv('SUPABASE_ANON_KEY'),
        'service_key': os.getenv('SUPABASE_SERVICE_ROLE_KEY'),
        'database_url': os.getenv('DATABASE_URL')
    }
    
    return config

def get_database_connection():
    """Get database connection using Supabase configuration"""
    config = get_supabase_config()
    
    try:
        # First try DATABASE_URL (direct connection string)
        if config['database_url']:
            print(f"✅ Connecting to Supabase database...")
            return psycopg2.connect(config['database_url'])
        
        # If no DATABASE_URL, provide helpful guidance
        if config['url']:
            project_id = config['url'].replace('https://', '').split('.')[0]
            print(f"🔍 Supabase project detected: {project_id}")
            print("❌ DATABASE_URL not found in environment variables")
            print("\n📋 To fix this:")
            print("1. Go to: https://supabase.com/dashboard/project/ttmzicudvdttxespjlsy/settings/database")
            print("2. Copy the 'Connection string' under 'Connection parameters'")
            print("3. Replace [YOUR-PASSWORD] with your actual database password")
            print("4. Add it to your .env file as:")
            print("   DATABASE_URL=postgresql://postgres:[password]@db.ttmzicudvdttxespjlsy.supabase.co:5432/postgres")
            return None
        
        print("❌ No Supabase configuration found")
        print("Please check your .env file contains:")
        print("- SUPABASE_URL")
        print("- DATABASE_URL")
        return None
        
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("\n🔧 Troubleshooting:")
        print("1. Verify DATABASE_URL is correct in .env file")
        print("2. Check your database password")
        print("3. Ensure your IP is whitelisted in Supabase")
        print("4. Test connection from Supabase dashboard")
        return None

def check_database_setup():
    """Check if database has required tables and functions for SwiftRoute"""
    conn = get_database_connection()
    if not conn:
        return False
    
    try:
        required_tables = ['nodes', 'road_segments', 'api_clients', 'api_keys', 'usage_records']
        required_functions = ['generate_api_key', 'hash_api_key', 'validate_api_key']
        
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            print("\n🔍 Checking database setup...")
            
            # Check tables
            missing_tables = []
            for table in required_tables:
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.tables 
                        WHERE table_schema = 'public' 
                        AND table_name = %s
                    )
                """, (table,))
                
                exists = cur.fetchone()['exists']
                status = "✅" if exists else "❌"
                print(f"  {status} Table: {table}")
                
                if not exists:
                    missing_tables.append(table)
                elif exists:
                    # Get row count for existing tables
                    cur.execute(f"SELECT COUNT(*) as count FROM public.{table}")
                    count = cur.fetchone()['count']
                    print(f"      └─ {count} rows")
            
            # Check functions
            missing_functions = []
            for func in required_functions:
                cur.execute("""
                    SELECT EXISTS (
                        SELECT FROM information_schema.routines 
                        WHERE routine_schema = 'public' 
                        AND routine_name = %s
                    )
                """, (func,))
                
                exists = cur.fetchone()['exists']
                status = "✅" if exists else "❌"
                print(f"  {status} Function: {func}")
                
                if not exists:
                    missing_functions.append(func)
            
            # Check PostGIS extension
            cur.execute("SELECT EXISTS(SELECT 1 FROM pg_extension WHERE extname = 'postgis')")
            postgis_exists = cur.fetchone()['exists']
            status = "✅" if postgis_exists else "❌"
            print(f"  {status} PostGIS extension")
            
            # Summary
            if missing_tables or missing_functions or not postgis_exists:
                print("\n❌ Database setup incomplete!")
                
                if not postgis_exists:
                    print("  - Missing: PostGIS extension")
                
                if missing_tables:
                    print("  - Missing tables:", ", ".join(missing_tables))
                
                if missing_functions:
                    print("  - Missing functions:", ", ".join(missing_functions))
                
                print("\n📋 Next steps:")
                print("1. Apply all migrations in Supabase SQL Editor:")
                print("   https://supabase.com/dashboard/project/ttmzicudvdttxespjlsy")
                print("2. Run migrations in this order:")
                print("   - supabase/migrations/20251013073159_*.sql")
                print("   - supabase/migrations/20251013073413_*.sql") 
                print("   - supabase/migrations/20251026000006_*.sql")
                print("   - supabase/migrations/20251026000007_*.sql")
                
                return False
            else:
                print("\n✅ Database setup complete!")
                return True
                
    except Exception as e:
        print(f"❌ Error checking database setup: {e}")
        return False
    finally:
        conn.close()

def print_env_status():
    """Print current environment variable status"""
    config = get_supabase_config()
    
    print("🔧 Environment Configuration Status:")
    print("=" * 40)
    
    # Supabase URL
    if config['url']:
        project_id = config['url'].replace('https://', '').split('.')[0]
        print(f"✅ SUPABASE_URL: {project_id}.supabase.co")
    else:
        print("❌ SUPABASE_URL: Not set")
    
    # Anon Key
    if config['anon_key']:
        print(f"✅ SUPABASE_ANON_KEY: {config['anon_key'][:20]}...")
    else:
        print("❌ SUPABASE_ANON_KEY: Not set")
    
    # Service Key
    if config['service_key']:
        print(f"✅ SUPABASE_SERVICE_ROLE_KEY: {config['service_key'][:20]}...")
    else:
        print("❌ SUPABASE_SERVICE_ROLE_KEY: Not set")
    
    # Database URL
    if config['database_url']:
        # Mask password in URL for security
        masked_url = config['database_url']
        if '@' in masked_url:
            parts = masked_url.split('@')
            if ':' in parts[0]:
                user_pass = parts[0].split(':')
                if len(user_pass) >= 3:  # protocol:user:pass
                    user_pass[-1] = '***'
                    parts[0] = ':'.join(user_pass)
            masked_url = '@'.join(parts)
        print(f"✅ DATABASE_URL: {masked_url}")
    else:
        print("❌ DATABASE_URL: Not set")
    
    print()

if __name__ == "__main__":
    """Test the database configuration"""
    print("SwiftRoute Database Configuration Test")
    print("=" * 50)
    
    # Print environment status
    print_env_status()
    
    # Test database connection
    conn = get_database_connection()
    if conn:
        print("✅ Database connection successful!")
        conn.close()
        
        # Check database setup
        check_database_setup()
    else:
        print("❌ Database connection failed!")
        sys.exit(1)