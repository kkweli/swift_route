#!/usr/bin/env python3
"""
SwiftRoute FastAPI Service Startup Script
Starts the route optimization service
"""

import os
import sys
import subprocess
from pathlib import Path

def check_python_version():
    """Check if Python version is compatible"""
    if sys.version_info < (3, 8):
        print("❌ Python 3.8 or higher is required")
        sys.exit(1)
    print(f"✅ Python {sys.version_info.major}.{sys.version_info.minor} detected")

def install_dependencies():
    """Install required dependencies"""
    requirements_file = Path("api/v1/optimize-route/requirements.txt")
    
    if not requirements_file.exists():
        print("❌ Requirements file not found")
        sys.exit(1)
    
    print("📦 Installing dependencies...")
    try:
        subprocess.run([
            sys.executable, "-m", "pip", "install", "-r", str(requirements_file)
        ], check=True, capture_output=True)
        print("✅ Dependencies installed successfully")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        print("Try running: pip install -r api/v1/optimize-route/requirements.txt")
        sys.exit(1)

def check_environment():
    """Check environment variables"""
    required_vars = [
        'DATABASE_URL',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables in your .env file")
        sys.exit(1)
    
    print("✅ Environment variables configured")

def configure_proxy_settings():
    """Configure proxy and SSL settings for corporate environment"""
    import ssl
    
    # Configure proxy settings
    proxy_url = os.getenv('HTTP_PROXY') or os.getenv('http_proxy')
    if proxy_url:
        print(f"🌐 Using proxy: {proxy_url}")
        
        # Set proxy environment variables for all libraries
        os.environ['HTTP_PROXY'] = proxy_url
        os.environ['HTTPS_PROXY'] = proxy_url
        os.environ['http_proxy'] = proxy_url
        os.environ['https_proxy'] = proxy_url
    
    # Disable SSL verification for corporate proxies
    print("🔧 Configuring SSL for corporate environment...")
    os.environ['PYTHONHTTPSVERIFY'] = '0'
    os.environ['SSL_VERIFY'] = 'false'
    
    # Create unverified SSL context
    try:
        ssl._create_default_https_context = ssl._create_unverified_context
        print("✅ SSL verification disabled for corporate proxy")
    except Exception as e:
        print(f"⚠️ SSL configuration warning: {e}")
    
    print("✅ Proxy configuration complete")

def start_server():
    """Start the FastAPI server"""
    print("🚀 Starting SwiftRoute Optimization API...")
    
    # Change to the API directory
    api_dir = Path("api/v1/optimize-route")
    os.chdir(api_dir)
    
    # Start uvicorn server
    try:
        subprocess.run([
            sys.executable, "-m", "uvicorn",
            "main:app",
            "--host", "0.0.0.0",
            "--port", "8000",
            "--reload",
            "--log-level", "info"
        ], check=True)
    except KeyboardInterrupt:
        print("\n👋 SwiftRoute Optimization API stopped")
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to start server: {e}")
        sys.exit(1)

def main():
    """Main startup function"""
    print("🚀 SwiftRoute FastAPI Service Startup")
    print("=" * 50)
    
    # Load environment variables
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print("✅ Environment variables loaded")
    except ImportError:
        print("⚠️  python-dotenv not installed, skipping .env file loading")
    
    # Configure proxy and SSL settings
    configure_proxy_settings()
    
    # Run checks
    check_python_version()
    check_environment()
    
    # Install dependencies if needed
    try:
        import fastapi
        import uvicorn
        import asyncpg
        print("✅ Dependencies already installed")
    except ImportError:
        install_dependencies()
    
    # Start server
    start_server()

if __name__ == "__main__":
    main()