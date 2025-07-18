// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://zgeniesyqommbdfwzreg.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpnZW5pZXN5cW9tbWJkZnd6cmVnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEzOTg4NjcsImV4cCI6MjA2Njk3NDg2N30.lEnvwib8Kq-PoIJ4MeN_63vwopf1k-IK4qhNRVfTrD4";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});