import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/src/lib/db/types";

const supabase = createSupabaseClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function createClient() {
  return supabase;
}

export { supabase };
