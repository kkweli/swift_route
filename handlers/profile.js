/**
 * SwiftRoute Profile API - User Profile Management
 * Handles: GET /profile, PUT /profile
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // Authenticate user
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authorization required' }
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid token' }
      });
    }

    // GET - Fetch profile
    if (req.method === 'GET') {
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      // If profile doesn't exist yet, return user data from auth
      if (error && error.code === 'PGRST116') {
        return res.status(200).json({
          data: {
            id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null,
            created_at: user.created_at
          }
        });
      }

      if (error) throw error;

      return res.status(200).json({
        data: profile
      });
    }

    // PUT - Update profile
    if (req.method === 'PUT') {
      const updates = req.body;

      // Upsert profile (create if doesn't exist, update if exists)
      const { data: profile, error } = await supabase
        .from('user_profiles')
        .upsert({
          id: user.id,
          ...updates,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      return res.status(200).json({
        data: profile,
        message: 'Profile updated successfully'
      });
    }

    return res.status(405).json({
      error: { code: 'METHOD_NOT_ALLOWED', message: `Method ${req.method} not allowed` }
    });

  } catch (error) {
    console.error('Profile API error:', error);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Internal server error', details: error.message }
    });
  }
}
