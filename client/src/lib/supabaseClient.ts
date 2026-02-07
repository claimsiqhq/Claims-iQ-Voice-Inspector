import { createClient, SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

let supabase: SupabaseClient;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase URL or Anon Key not configured. Auth will not work.");
  supabase = null as any;
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };
