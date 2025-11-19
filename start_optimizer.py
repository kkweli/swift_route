import sys
import os
from http.server import HTTPServer, BaseHTTPRequestHandler

# Add project root to sys.path
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

# The 'api' directory needs to be on the sys.path for 'api.v1.optimize_route.main' to be imported.
# Since project_root is added, and 'api' is a direct subdirectory, this should work.
# If not, an explicit addition of 'api_path' might be needed, but let's try this first.

try:
    # Attempt to import the handler class directly
    from api.v1.optimize_route.main import handler as api_handler
    print("SUCCESS: Imported api.v1.optimize_route.main.handler")
except ImportError as e:
    print(f"ERROR: Failed to import handler: {e}")
    print(f"Current sys.path: {sys.path}")
    sys.exit(1)

PORT = 8000 # Choose a port for the Python API server

if __name__ == "__main__":
    server_address = ('', PORT)
    # Use the imported api_handler directly, as it already inherits from BaseHTTPRequestHandler
    httpd = HTTPServer(server_address, api_handler)
    print(f"Starting Python API server on http://localhost:{PORT}...")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down Python API server.")
        httpd.server_close()
