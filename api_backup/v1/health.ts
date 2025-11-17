/**
 * SwiftRoute Health Check API Endpoint
 * Simple endpoint to test API authentication and system status
 */

import { authenticateAPIRequest, createAPIErrorResponse, createAPISuccessResponse, recordAPIUsage } from '../lib/middleware.js';

export default async function handler(request: Request): Promise<Response> {
  const startTime = Date.now();
  let keyId: string | undefined;

  try {
    // Only require authentication for non-GET requests or when API key is provided
    const method = request.method;
    const hasAPIKey = request.headers.get('authorization') || request.headers.get('x-api-key');

    let authResult;
    if (hasAPIKey) {
      // Authenticate if API key is provided
      authResult = await authenticateAPIRequest(request);
      
      if (!authResult.success) {
        return createAPIErrorResponse(
          authResult.error!,
          authResult.statusCode!
        );
      }
      
      keyId = authResult.keyInfo?.keyId;
    }

    // Handle different HTTP methods
    switch (method) {
      case 'GET':
        return handleHealthCheck(authResult, startTime, keyId);
      
      default:
        return createAPIErrorResponse(
          `Method ${method} not allowed`,
          405
        );
    }

  } catch (error) {
    console.error('Health check error:', error);
    
    // Record failed usage if we have a key ID
    if (keyId) {
      await recordAPIUsage(
        keyId,
        '/api/v1/health',
        { method: request.method },
        Date.now() - startTime,
        false,
        'INTERNAL_SERVER_ERROR'
      );
    }

    return createAPIErrorResponse(
      'Internal server error',
      500
    );
  }
}

async function handleHealthCheck(
  authResult: any,
  startTime: number,
  keyId?: string
): Promise<Response> {
  const responseTime = Date.now() - startTime;
  
  // Prepare response data
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'operational',
      authentication: authResult ? 'authenticated' : 'public',
      api: 'operational'
    }
  };

  // Prepare metadata
  const metadata = {
    processing_time: responseTime,
    algorithm_used: 'none',
    request_id: `health_${Date.now()}`
  };

  // Prepare usage info (if authenticated)
  let usage = {};
  if (authResult?.rateLimitInfo) {
    usage = {
      requests_remaining: authResult.rateLimitInfo.remaining,
      billing_tier: authResult.keyInfo?.billingTier
    };
  }

  // Record API usage if authenticated
  if (keyId) {
    await recordAPIUsage(
      keyId,
      '/api/v1/health',
      { method: 'GET' },
      responseTime,
      true
    );
  }

  return createAPISuccessResponse(
    healthData,
    metadata,
    usage
  );
}