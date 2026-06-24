// src/lib/supabase.js
//
// Supabase client singleton for the entire application.
//
// This file creates ONE shared instance of the Supabase JavaScript client that
// every hook, component, and page imports. A singleton is important here because
// each createClient() call would open its own WebSocket connection to Supabase's
// realtime server — sharing one instance keeps the connection count at 1.
//
// The client is initialized with two values from environment variables:
//   - VITE_SUPABASE_URL: the project's unique REST/Auth/Storage endpoint
//   - VITE_SUPABASE_ANON_KEY: the public "anonymous" JWT that Vite exposes
//     to the browser. It is NOT secret — Row Level Security (RLS) policies
//     enforce what each authenticated user is allowed to read/write.
//
// Vite exposes env vars prefixed with VITE_ to the browser bundle.
// Variables without that prefix stay server-side only.

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Fail loudly at startup if env vars are missing — better than a cryptic
// "Cannot read properties of undefined" deep inside a network call.
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
