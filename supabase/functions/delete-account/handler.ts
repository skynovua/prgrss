type DeleteAccountDependencies = {
  getUserId: (authorization: string) => Promise<string | null>;
  ensureReady: () => Promise<void>;
  deleteAvatars: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
};

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json",
};

export function createDeleteAccountHandler(deps: DeleteAccountDependencies) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers });
    if (req.method !== "POST")
      return Response.json({ error: "Method not allowed" }, { status: 405, headers });

    const authorization = req.headers.get("Authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return Response.json({ error: "Unauthorized" }, { status: 401, headers });
    }

    try {
      const userId = await deps.getUserId(authorization);
      if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401, headers });

      await deps.ensureReady();
      await deps.deleteAvatars(userId);
      await deps.deleteUser(userId);
      return Response.json({ success: true }, { headers });
    } catch (error) {
      console.error("Account deletion failed", error);
      return Response.json({ error: "Account deletion failed" }, { status: 500, headers });
    }
  };
}
