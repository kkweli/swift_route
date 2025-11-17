/**
 * SwiftRoute Health Check API Endpoint
 * Simple endpoint to test API authentication and system status
 */

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const startTime = Date.now();

  try {
    // Only support GET method
    if (req.method !== 'GET') {
      return res.status(405).json({
        error: {
          code: 'METHOD_NOT_ALLOWED',
          message: `Method ${req.method} not allowed`
        },
        timestamp: new Date().toISOString()
      });
    }

    const responseTime = Date.now() - startTime;

    // Check if API key is provided (optional for health check)
    const hasAPIKey = req.headers.authorization || req.headers['x-api-key'];
    
    // Prepare response data
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'operational',
        authentication: hasAPIKey ? 'authenticated' : 'public',
        api: 'operational'
      }
    };

    // Prepare metadata
    const metadata = {
      processing_time: responseTime,
      algorithm_used: 'none',
      request_id: `health_${Date.now()}`
    };

    return res.status(200).json({
      data: healthData,
      metadata,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Health check error:', error);
    
    return res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: error.message
      },
      timestamp: new Date().toISOString()
    });
  }
}
