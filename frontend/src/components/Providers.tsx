"use client";

import { AuthProvider } from "react-oidc-context";
import React from "react";

// Pulls keys intelligently from your .env.local!
const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_B7zUdvpHb",
  client_id: "40ps5mipuj6g2vhhec9skkiog2",
  redirect_uri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  post_logout_redirect_uri: typeof window !== "undefined" ? window.location.origin : "http://localhost:3000",
  response_type: "code",
  scope: "email openid phone",
};

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider {...cognitoAuthConfig}>
      {children}
    </AuthProvider>
  );
}
