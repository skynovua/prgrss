import { useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";

import { useAuth } from "@/shared/auth";

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    navigate({ to: user ? "/dashboard" : "/login" });
  }, [loading, navigate, user]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="bg-primary h-0.5 w-32 animate-pulse" />
    </div>
  );
}
