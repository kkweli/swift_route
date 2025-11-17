/**
 * SwiftRoute Unified API Handler
 * Single entry point that routes to individual handlers
 * Keeps function count at 1 for TypeScript/JavaScript endpoints
 */

import healthHandler from '../handlers/health.js';
import billingHandler from '../handlers/billing/index.js';
import keysHandler from '../handlers/keys/index.js';
import profileHandler from '../handlers/profile.js';
import usageHandler from '../handlers/usage.js';

export default async function handler(req, res) {
  const path = req.url?.split('?')[0] || '';

  // Route based on path
  if (path.includes('/health')) {
    return healthHandler(req, res);
  } else if (path.includes('/billing')) {
    return billingHandler(req, res);
  } else if (path.includes('/keys')) {
    return keysHandler(req, res);
  } else if (path.includes('/profile')) {
    return profileHandler(req, res);
  } else if (path.includes('/usage')) {
    return usageHandler(req, res);
  }

  // Not found
  res.status(404).json({
    error: { code: 'NOT_FOUND', message: 'Endpoint not found' }
  });
}
