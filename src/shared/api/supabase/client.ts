import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/shared/db";

const supabase = createSupabaseClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

export function createClient() {
  return supabase;
}

export { supabase };
