"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { createClient } from "@/lib/supabase/client";

interface AuthContextValue {
  isReady: boolean;
  userId: string | null;
  isConfigured: boolean;
  authError: string | null;
}

const AuthContext = createContext<AuthContextValue>({
  isReady: false,
  userId: null,
  isConfigured: false,
  authError: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const initAuth = useCallback(async () => {
    const supabase = createClient();

    if (!supabase) {
      setIsConfigured(false);
      setIsReady(true);
      return;
    }

    setIsConfigured(true);
    setAuthError(null);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        setUserId(session.user.id);
        setIsReady(true);
        return;
      }

      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error("[Auth] anonymous sign-in failed", error);
        setAuthError(
          error.message.includes("disabled")
            ? "Enable Anonymous Sign-Ins in Supabase → Authentication → Providers"
            : error.message
        );
      } else if (data.user) {
        setUserId(data.user.id);
      }
    } catch (err) {
      console.error("[Auth] init failed", err);
      setAuthError("Could not start a session. Please refresh the page.");
    }

    setIsReady(true);
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <AuthContext.Provider value={{ isReady, userId, isConfigured, authError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
