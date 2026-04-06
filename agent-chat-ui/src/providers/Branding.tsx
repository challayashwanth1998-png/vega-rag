import React, { createContext, useContext, ReactNode } from "react";

interface BrandingContextType {
  appName: string;
  logoUrl: string;
}

const BrandingContext = createContext<BrandingContextType>({
  appName: "Agent Chat",
  logoUrl: "",
});

export const BrandingProvider = ({
  children,
  appName,
  logoUrl,
}: {
  children: ReactNode;
  appName: string;
  logoUrl: string;
}) => (
  <BrandingContext.Provider value={{ appName, logoUrl }}>
    {children}
  </BrandingContext.Provider>
);

export const useBranding = () => useContext(BrandingContext);
