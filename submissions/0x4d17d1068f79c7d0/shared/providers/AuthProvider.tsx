"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { flowAuth } from "../config/flow";

interface User {
  id: string;
  email?: string;
  flowAddress?: string;
  authMethod: "supabase" | "flow";
  profile?: {
    name?: string;
    avatar?: string;
  };
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithFlow: () => Promise<void>;
  signInWithSupabase: () => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Only create Supabase client if environment variables are available
  const supabase =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? createClientComponentClient()
      : null;

  useEffect(() => {
    // Initialize auth state
    initializeAuth();

    // Listen for Flow auth changes
    const unsubscribeFlow = flowAuth.onAuthChange((flowUser: any) => {
      if (flowUser.loggedIn && flowUser.addr) {
        setUser({
          id: flowUser.addr,
          flowAddress: flowUser.addr,
          authMethod: "flow",
          profile: {
            name: `Flow User ${flowUser.addr.slice(0, 8)}...`,
          },
        });
      } else if (user?.authMethod === "flow") {
        setUser(null);
      }
      setLoading(false);
    });

    // Listen for Supabase auth changes (only if client is available)
    let subscription: any = null;
    if (supabase) {
      const {
        data: { subscription: sub },
      } = supabase.auth.onAuthStateChange((event, session) => {
        if (session?.user && !user?.flowAddress) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            authMethod: "supabase",
            profile: {
              name:
                session.user.user_metadata?.name ||
                session.user.email?.split("@")[0],
              avatar: session.user.user_metadata?.avatar_url,
            },
          });
        } else if (!session && user?.authMethod === "supabase") {
          setUser(null);
        }
        setLoading(false);
      });
      subscription = sub;
    }

    return () => {
      unsubscribeFlow();
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const initializeAuth = async () => {
    try {
      // Check Flow auth first (preferred for Web3 users)
      const flowUser = await flowAuth.getCurrentUser();
      if (flowUser?.loggedIn && flowUser?.addr) {
        setUser({
          id: flowUser.addr,
          flowAddress: flowUser.addr,
          authMethod: "flow",
          profile: {
            name: `Flow User ${flowUser.addr.slice(0, 8)}...`,
          },
        });
        setLoading(false);
        return;
      }

      // Check Supabase auth as fallback (only if client is available)
      if (supabase) {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session?.user) {
          setUser({
            id: session.user.id,
            email: session.user.email,
            authMethod: "supabase",
            profile: {
              name:
                session.user.user_metadata?.name ||
                session.user.email?.split("@")[0],
              avatar: session.user.user_metadata?.avatar_url,
            },
          });
        }
      }
    } catch (error) {
      console.error("Auth initialization error:", error);
    } finally {
      setLoading(false);
    }
  };

  const signInWithFlow = async () => {
    setLoading(true);
    try {
      await flowAuth.signIn();
    } catch (error) {
      console.error("Flow sign in error:", error);
      setLoading(false);
    }
  };

  const signInWithSupabase = async () => {
    if (!supabase) {
      console.error("Supabase client not available");
      return;
    }
    setLoading(true);
    try {
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
    } catch (error) {
      console.error("Supabase sign in error:", error);
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      if (user?.authMethod === "flow") {
        await flowAuth.signOut();
      } else if (supabase) {
        await supabase.auth.signOut();
      }
      setUser(null);
    } catch (error) {
      console.error("Sign out error:", error);
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signInWithFlow,
    signInWithSupabase,
    signOut,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
