// Supabase Configuration
// Centralized Supabase client configuration for the application

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

// Create and export Supabase client
export const supabase = typeof window !== 'undefined' &&
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? createClientComponentClient()
  : null;

// Export types for TypeScript
export type SupabaseClient = typeof supabase;

// Helper function to ensure Supabase is available
export function ensureSupabase() {
  if (!supabase) {
    throw new Error('Supabase client not available. Check environment variables.');
  }
  return supabase;
}

// Database table names (for consistency)
export const TABLES = {
  USER_PROGRESS: 'user_progress',
  GAME_RESULTS: 'game_results',
  ACHIEVEMENTS: 'achievements',
  LEADERBOARD: 'leaderboard_entries',
  USER_ACHIEVEMENTS: 'user_achievements'
} as const;

// Helper function for safe database operations
export async function safeSupabaseOperation<T>(
  operation: () => Promise<{ data: T | null; error: any }>
): Promise<T | null> {
  try {
    const client = ensureSupabase();
    const { data, error } = await operation();
    
    if (error) {
      console.error('Supabase operation error:', error);
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Supabase operation failed:', error);
    return null;
  }
}
