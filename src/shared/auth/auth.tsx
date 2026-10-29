import { createContext, useContext, useEffect, useState } from "react";

import { supabase } from "@/shared/api";

import { type SessionState, subscribeToSession } from "./session-bootstrap";

export interface AuthContextType extends SessionState {
  retry: () => void;
}

const INITIAL_STATE: SessionState = { user: null, loading: true, error: null };
const AuthContext = createContext<AuthContextType>({ ...INITIAL_STATE, retry: () => {} });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<SessionState>(INITIAL_STATE);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    return subscribeToSession(supabase.auth, setState);
  }, [attempt]);

  const retry = () => {
    setState(INITIAL_STATE);
    setAttempt((value) => value + 1);
  };

  return <AuthContext.Provider value={{ ...state, retry }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
