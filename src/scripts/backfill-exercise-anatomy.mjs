import { createClient } from "@supabase/supabase-js";

import { backfillExerciseAnatomy } from "./exercise-anatomy-backfill.mjs";

const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error("Для синхронізації потрібні URL Supabase і серверний ключ.");
const args = process.argv.slice(2);
if (args.some((arg) => arg !== "--apply")) throw new Error("Доступний параметр: --apply");

const supabase = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});
await backfillExerciseAnatomy(supabase, { apply: args.includes("--apply") });
