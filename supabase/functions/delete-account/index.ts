import { createClient } from "npm:@supabase/supabase-js@2";

import { createDeleteAccountHandler } from "./handler.ts";
import { deleteAvatarFolder } from "./storage.ts";

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ?? "";
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
if (!supabaseUrl || !anonKey || !serviceRoleKey) throw new Error("Missing Supabase configuration");

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

Deno.serve(
  createDeleteAccountHandler({
    async getUserId(authorization) {
      const client = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authorization } },
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const {
        data: { user },
        error,
      } = await client.auth.getUser();
      return error ? null : (user?.id ?? null);
    },
    async ensureReady() {
      const { data, error } = await admin.rpc("account_deletion_ready");
      if (error || data !== true) throw new Error("Account deletion migration is not ready");
    },
    async deleteAvatars(userId) {
      await deleteAvatarFolder(admin.storage.from("avatars"), userId);
    },
    async deleteUser(userId) {
      const { error } = await admin.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
  })
);
