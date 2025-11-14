/**
 * SwiftRoute API Server
 * Express.js server for hosting SwiftRoute B2B API endpoints
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (no authentication required)
app.get('/api/v1/health', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Simple health check implementation
    const healthData = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        database: 'operational',
        authentication: 'operational',
        api: 'operational'
      }
    };

    const responseTime = Date.now() - startTime;
    
    const response = {
      data: healthData,
      metadata: {
        processing_time: responseTime,
        algorithm_used: 'none',
        request_id: `health_${Date.now()}`
      },
      usage: {},
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    res.status(200).json(response);
    
  } catch (error) {
    console.error('Health endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Usage statistics endpoint (requires authentication)
app.get('/api/v1/usage', async (req, res) => {
  try {
    const { default: usageHandler } = await import('./api/v1/usage.js');
    await usageHandler(req, res);
  } catch (error) {
    console.error('Usage endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Route optimization endpoint (requires authentication)
app.post('/api/v1/optimize', async (req, res) => {
  try {
    const { default: optimizeHandler } = await import('./api/v1/optimize.js');
    await optimizeHandler(req, res);
  } catch (error) {
    console.error('Optimize endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Batch route optimization endpoint (future feature)
app.post('/api/v1/optimize/batch', async (req, res) => {
  try {
    const { batchOptimizeRoutes } = await import('./api/v1/optimize.js');
    await batchOptimizeRoutes(req, res);
  } catch (error) {
    console.error('Batch optimize endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Client profile endpoint (requires authentication)
app.get('/api/v1/clients/profile', async (req, res) => {
  try {
    const { getClientProfile } = await import('./api/v1/clients.js');
    await getClientProfile(req, res);
  } catch (error) {
    console.error('Client profile endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Create API key endpoint (requires authentication)
app.post('/api/v1/clients/keys', async (req, res) => {
  try {
    const { createAPIKey } = await import('./api/v1/clients.js');
    await createAPIKey(req, res);
  } catch (error) {
    console.error('Create API key endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
});

// Deactivate API key endpoint (requires authentication)
app.delete('/api/v1/clients/keys/:key_id', async (req, res) => {
  try {
    const { deactivateAPIKey } = await import('./api/v1/clients.js');
    await deactivateAPIKey(req, res);
  } catch (error) {
    console.error('Deactivate API key endpoint error:', error);
    res.status(500).json({
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        details: null
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
});

// API documentation endpoint
app.get('/api/v1/docs', (req, res) => {
  res.json({
    name: 'SwiftRoute API',
    version: '1.0.0',
    description: 'B2B Route Optimization API powered by Graph Neural Networks',
    endpoints: {
      'GET /api/v1/health': 'Health check and system status',
      'GET /api/v1/usage': 'Usage statistics and rate limiting info (requires API key)',
      'POST /api/v1/optimize': 'Route optimization with GNN algorithms (requires API key)',
      'POST /api/v1/optimize/batch': 'Batch route optimization (coming soon)',
      'GET /api/v1/clients/profile': 'Get client profile and API keys (requires API key)',
      'POST /api/v1/clients/keys': 'Create new API key (requires API key)',
      'DELETE /api/v1/clients/keys/:id': 'Deactivate API key (requires API key)'
    },
    authentication: {
      type: 'API Key',
      header: 'X-API-Key or Authorization: Bearer {key}',
      format: 'sk_...',
      example: 'curl -H "X-API-Key: sk_..." http://localhost:3001/api/v1/usage'
    },
    rate_limits: {
      starter: '10 requests/minute',
      professional: '50 requests/minute',
      enterprise: '200 requests/minute'
    },
    billing_tiers: {
      starter: { requests_per_month: 1000, cost_per_request: '$0.01' },
      professional: { requests_per_month: 10000, cost_per_request: '$0.008' },
      enterprise: { requests_per_month: 100000, cost_per_request: '$0.005' }
    },
    examples: {
      route_optimization: {
        url: 'POST /api/v1/optimize',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'sk_your_api_key_here'
        },
        body: {
          origin: { lat: -1.2921, lng: 36.8219 },
          destination: { lat: -1.2864, lng: 36.8172 },
          vehicle_type: 'car',
          optimization_preference: 'time',
          constraints: {
            avoid_traffic: true,
            avoid_tolls: false
          }
        }
      }
    },
    support: 'https://swiftroute.com/support'
  });
});

// Catch-all for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Endpoint ${req.method} ${req.path} not found`,
      details: 'Check the API documentation at /api/v1/docs'
    },
    request_id: `req_${Date.now()}`,
    timestamp: new Date().toISOString()
  });
});

// Serve static files (for frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// Root endpoint for API info
app.get('/', (req, res) => {
  res.json({
    name: 'SwiftRoute API',
    version: '1.0.0',
    description: 'B2B Route Optimization API powered by Graph Neural Networks',
    endpoints: {
      'GET /api/v1/health': 'Health check and system status',
      'GET /api/v1/docs': 'API documentation',
      'POST /api/v1/optimize': 'Route optimization (coming soon)'
    },
    documentation: '/api/v1/docs',
    status: 'operational'
  });
});

// Handle favicon requests
app.get('/favicon.ico', (req, res) => {
  res.status(204).end();
});

// Handle common browser requests
app.get('/.well-known/*', (req, res) => {
  res.status(404).end();
});

// Catch-all handler for non-API routes
app.get('*', (req, res) => {
  // If it's an API route that doesn't exist, it's already handled above
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({
      error: {
        code: 'NOT_FOUND',
        message: `Endpoint ${req.method} ${req.path} not found`,
        details: 'Check the API documentation at /api/v1/docs'
      },
      request_id: `req_${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  }
  
  // For non-API routes, redirect to API info
  res.redirect('/api/v1/docs');
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      details: null
    },
    request_id: `req_${Date.now()}`,
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 SwiftRoute API Server running on port ${PORT}`);
  console.log(`📋 API Documentation: http://localhost:${PORT}/api/v1/docs`);
  console.log(`🏥 Health Check: http://localhost:${PORT}/api/v1/health`);
  console.log(`🌐 Frontend: http://localhost:${PORT}`);
});

export default app;