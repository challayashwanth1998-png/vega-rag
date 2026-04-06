"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { Amplify } from "aws-amplify";
import { getCurrentUser, signOut, fetchUserAttributes } from "aws-amplify/auth";
import { useRouter, usePathname } from "next/navigation";

// Initialize AWS Amplify for Cognito User Pool logic.
Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: process.env.NEXT_PUBLIC_COGNITO_USER_POOL_ID || "us-east-1_B7zUdvpHb",
      userPoolClientId: process.env.NEXT_PUBLIC_COGNITO_APP_CLIENT_ID || "40ps5mipuj6g2vhhec9skkiog2",
    },
  },
});

type CustomAuthUser = {
  username: string;
  userId: string;
  email?: string;
};

type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: { profile?: { email?: string; sub?: string } } | null;
  signinRedirect: () => void;
  signoutRedirect: () => Promise<void>;
  refreshAuth: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<CustomAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleGetCurrentUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      const attributes = await fetchUserAttributes();
      setUser({ ...currentUser, email: attributes.email });
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    // Initial load + refresh on path changes
    handleGetCurrentUser();
  }, [pathname]);

  const value = {
    isAuthenticated: !!user,
    isLoading,
    user: user ? { profile: { email: user.email, sub: user.userId } } : null,
    signinRedirect: () => router.push("/login"),
    signoutRedirect: async () => {
      try {
        await signOut();
        setUser(null);
        router.push("/");
      } catch (e) {
        console.error("Sign out failed", e);
      }
    },
    refreshAuth: handleGetCurrentUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
