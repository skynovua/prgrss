import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/shared/auth";
import { PageLoading } from "@/shared/ui";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    navigate({ to: user ? "/dashboard" : "/login" });
  }, [loading, navigate, user]);

  return <PageLoading title="Входимо до PRGRSS…" />;
}
