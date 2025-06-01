"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { flowAuth, getWalletType } from "../config/flow";
import { getUserId } from "../services/UserIdService";

// Enhanced User Profile with clear tier system
export type UserTier = "anonymous" | "supabase" | "flow";

export interface UserProfile {
  id: string;
  email?: string;
  flowAddress?: string;
  authMethod: "supabase" | "flow";
  walletType?: "cadence" | "evm" | "unknown" | null;
  tier: UserTier;
  profile?: {
    name?: string;
    avatar?: string;
  };
  capabilities: {
    canEarnPoints: boolean;
    canJoinLeaderboard: boolean;
    canEarnAchievements: boolean;
    canUseVRF: boolean;
    canEarnNFTs: boolean;
    scoreMultiplier: number;
    maxDifficulty?: number;
  };
  experience: {
    showUpgradePrompts: boolean;
    showLimitedFeatures: boolean;
    showFullFeatures: boolean;
  };
}

// Anonymous user profile for consistent handling
export const ANONYMOUS_USER_PROFILE = {
  tier: "anonymous" as UserTier,
  capabilities: {
    canEarnPoints: false,
    canJoinLeaderboard: false,
    canEarnAchievements: false,
    canUseVRF: false,
    canEarnNFTs: false,
    scoreMultiplier: 0,
    maxDifficulty: 7, // Limited difficulty for anonymous users
  },
  experience: {
    showUpgradePrompts: true,
    showLimitedFeatures: true,
    showFullFeatures: false,
  },
};

interface AuthContextType {
  user: UserProfile | null;
  userTier: UserTier;
  loading: boolean;
  error: string | null;
  signInWithFlow: () => Promise<void>;
  signInWithSupabase: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAuthenticated: boolean;
  canAccessFeature: (feature: keyof UserProfile["capabilities"]) => boolean;
  getUserCapabilities: () => UserProfile["capabilities"];
  getUserExperience: () => UserProfile["experience"];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper functions to create user profiles based on auth method
function createSupabaseUserProfile(session: any): UserProfile {
  // Get consistent UUID for this Supabase user
  const consistentId = getUserId("supabase", session.user.id);

  return {
    id: consistentId,
    email: session.user.email,
    authMethod: "supabase",
    tier: "supabase",
    profile: {
      name:
        session.user.user_metadata?.name || session.user.email?.split("@")[0],
      avatar: session.user.user_metadata?.avatar_url,
    },
    capabilities: {
      canEarnPoints: true,
      canJoinLeaderboard: true,
      canEarnAchievements: true,
      canUseVRF: false,
      canEarnNFTs: false,
      scoreMultiplier: 0.8, // 80% scoring for Supabase users
      maxDifficulty: 10,
    },
    experience: {
      showUpgradePrompts: true,
      showLimitedFeatures: false,
      showFullFeatures: false,
    },
  };
}

function createFlowUserProfile(flowUser: any): UserProfile {
  const walletType = getWalletType(flowUser);
  const walletTypeLabel =
    walletType === "evm"
      ? "EVM"
      : walletType === "cadence"
      ? "Cadence"
      : "Flow";

  console.log("🔍 Creating Flow user profile:", {
    flowUserAddr: flowUser.addr,
    walletType,
    fullFlowUser: flowUser,
  });

  // Get consistent UUID for this Flow user
  const consistentId = getUserId("flow", flowUser.addr);

  return {
    id: consistentId,
    flowAddress: flowUser.addr,
    authMethod: "flow",
    tier: "flow",
    walletType,
    profile: {
      name: `${walletTypeLabel} User ${flowUser.addr.slice(0, 8)}...`,
    },
    capabilities: {
      canEarnPoints: true,
      canJoinLeaderboard: true,
      canEarnAchievements: true,
      canUseVRF: true,
      canEarnNFTs: true,
      scoreMultiplier: 1.0, // 100% scoring for Flow users
      maxDifficulty: undefined, // No limit
    },
    experience: {
      showUpgradePrompts: false,
      showLimitedFeatures: false,
      showFullFeatures: true,
    },
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Helper functions for the context
  const userTier: UserTier = user?.tier || "anonymous";

  const canAccessFeature = (
    feature: keyof UserProfile["capabilities"]
  ): boolean => {
    if (!user) return ANONYMOUS_USER_PROFILE.capabilities[feature] as boolean;
    return user.capabilities[feature] as boolean;
  };

  const getUserCapabilities = (): UserProfile["capabilities"] => {
    return user?.capabilities || ANONYMOUS_USER_PROFILE.capabilities;
  };

  const getUserExperience = (): UserProfile["experience"] => {
    return user?.experience || ANONYMOUS_USER_PROFILE.experience;
  };

  // Prevent browser extension conflicts
  useEffect(() => {
    // Suppress wallet extension errors that don't affect our app
    const originalError = console.error;
    console.error = (...args) => {
      const errorMessage = args[0]?.toString() || "";
      if (
        !errorMessage.includes("wallet") &&
        !errorMessage.includes("extension") &&
        !errorMessage.includes("MetaMask")
      ) {
        originalError(...args);
      }
    };

    return () => {
      console.error = originalError;
    };
  }, []);

  // Only create Supabase client if environment variables are available
  const supabase =
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      ? createClientComponentClient()
      : null;

  // Improved authentication initialization with better error handling
  const initializeAuth = async () => {
    try {
      setError(null);
      setLoading(true);

      // Check Flow auth first (preferred for Web3 users)
      try {
        const flowUser = await flowAuth.getCurrentUser();
        if (flowUser?.loggedIn && flowUser?.addr) {
          const userProfile = createFlowUserProfile(flowUser);
          setUser(userProfile);
          console.log("✅ Flow user authenticated:", userProfile.tier);
          return;
        }
      } catch (flowError) {
        console.warn("Flow auth check failed:", flowError);
        // Continue to Supabase check
      }

      // Check Supabase auth as fallback (only if client is available)
      if (supabase) {
        try {
          const {
            data: { session },
            error: sessionError,
          } = await supabase.auth.getSession();

          if (sessionError) {
            console.warn("Supabase session error:", sessionError);
          } else if (session?.user) {
            const userProfile = createSupabaseUserProfile(session);
            setUser(userProfile);
            console.log("✅ Supabase user authenticated:", userProfile.tier);
            return;
          }
        } catch (supabaseError) {
          console.warn("Supabase auth check failed:", supabaseError);
        }
      }

      // No authentication found - user remains anonymous
      console.log("👤 Anonymous user session");
      setUser(null);
    } catch (error) {
      console.error("Auth initialization error:", error);
      setError("Authentication initialization failed");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // Main useEffect for authentication setup
  useEffect(() => {
    // Initialize auth state
    initializeAuth();

    // Listen for Flow auth changes with improved error handling
    const unsubscribeFlow = flowAuth.onAuthChange((flowUser: any) => {
      try {
        if (flowUser.loggedIn && flowUser.addr) {
          const userProfile = createFlowUserProfile(flowUser);
          setUser(userProfile);
          console.log("🔄 Flow auth changed:", userProfile.tier);
        } else if (user?.authMethod === "flow") {
          // Only clear user if they were previously a Flow user
          setUser(null);
          console.log("🔄 Flow user signed out");
        }
      } catch (error) {
        console.error("Flow auth change error:", error);
        setError("Flow authentication error");
      }
    });

    // Listen for Supabase auth changes (only if client is available)
    let supabaseSubscription: any = null;
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((event, session) => {
        try {
          if (session?.user && !user?.flowAddress) {
            // Only set Supabase user if no Flow user is active
            const userProfile = createSupabaseUserProfile(session);
            setUser(userProfile);
            console.log("🔄 Supabase auth changed:", userProfile.tier, event);
          } else if (!session && user?.authMethod === "supabase") {
            // Only clear user if they were previously a Supabase user
            setUser(null);
            console.log("🔄 Supabase user signed out");
          }
        } catch (error) {
          console.error("Supabase auth change error:", error);
          setError("Supabase authentication error");
        }
      });
      supabaseSubscription = subscription;
    }

    // Cleanup function
    return () => {
      try {
        unsubscribeFlow();
        if (supabaseSubscription) {
          supabaseSubscription.unsubscribe();
        }
      } catch (error) {
        console.warn("Auth cleanup error:", error);
      }
    };
  }, []); // Empty dependency array - only run once

  // Authentication methods with improved error handling
  const signInWithFlow = async () => {
    try {
      setLoading(true);
      setError(null);
      await flowAuth.signIn();
      // User state will be updated by the auth change listener
    } catch (error) {
      console.error("Flow sign in error:", error);
      setError("Failed to connect Flow wallet");
      setLoading(false);
    }
  };

  const signInWithSupabase = async () => {
    if (!supabase) {
      setError("Supabase authentication not available");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // For now, we'll redirect to the login page to use email auth
      // This maintains the existing button behavior but uses email instead of Google
      window.location.href = "/login?method=email";
    } catch (error) {
      console.error("Supabase sign in error:", error);
      setError("Failed to sign in with email");
      setLoading(false);
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error("Supabase authentication not available");
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      console.log("✅ Email signin successful:", data);

      // Always set loading to false after successful signin
      setLoading(false);
    } catch (error: any) {
      console.error("Email sign in error:", error);
      setError(error.message || "Failed to sign in with email");
      setLoading(false);
      throw error;
    }
  };

  const signUpWithEmail = async (email: string, password: string) => {
    if (!supabase) {
      throw new Error("Supabase authentication not available");
    }

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      console.log("✅ Email signup successful:", data);

      // Since email confirmations are disabled, user should be immediately available
      if (data.user && data.session) {
        console.log("🔄 User signed up and logged in immediately");
        // The auth state change listener will handle setting the user
      } else {
        console.log("📧 User signed up, waiting for auth state change");
      }

      // Always set loading to false after successful signup
      setLoading(false);
    } catch (error: any) {
      console.error("Email sign up error:", error);
      setError(error.message || "Failed to sign up with email");
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      setError(null);

      if (user?.authMethod === "flow") {
        await flowAuth.signOut();
      } else if (user?.authMethod === "supabase" && supabase) {
        await supabase.auth.signOut();
      }

      setUser(null);
      console.log("🚪 User signed out");
    } catch (error) {
      console.error("Sign out error:", error);
      setError("Failed to sign out");
    } finally {
      setLoading(false);
    }
  };

  // Context value with all the enhanced functionality
  const value: AuthContextType = {
    user,
    userTier,
    loading,
    error,
    signInWithFlow,
    signInWithSupabase,
    signInWithEmail,
    signUpWithEmail,
    signOut,
    isAuthenticated: !!user,
    canAccessFeature,
    getUserCapabilities,
    getUserExperience,
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
