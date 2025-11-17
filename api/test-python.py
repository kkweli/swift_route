"""
Minimal Python test endpoint for Vercel
"""

def handler(request):
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
        },
        "body": '{"status": "Python is working!", "message": "This is a minimal Python function on Vercel"}'
    }
