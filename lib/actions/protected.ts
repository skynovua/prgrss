"use server";

import { createClient } from "@/lib/supabase/server";

export async function withAuth<T>(
  fn: (userId: string, supabase: Awaited<ReturnType<typeof createClient>>) => Promise<T>
): Promise<T> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Не авторизовано");
  return fn(user.id, supabase);
}
