import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabase;
let supabaseAdmin;

if (typeof window === 'undefined') {
  // on server
  if (!global.supabaseClient) {
    global.supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  supabase = global.supabaseClient;

  if (!global.supabaseAdminClient) {
    global.supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  }
  supabaseAdmin = global.supabaseAdminClient;
} else {
  // on client
  if (!window.supabaseClient) {
    window.supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  supabase = window.supabaseClient;

  if (!window.supabaseAdminClient) {
    window.supabaseAdminClient = createClient(supabaseUrl, supabaseServiceKey || supabaseAnonKey);
  }
  supabaseAdmin = window.supabaseAdminClient;
}

export { supabase, supabaseAdmin };
