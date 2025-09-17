'use client';

import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ReactNode, useMemo } from "react";
import { api } from "@/convex/_generated/api";

function ConvexClientProviderClerk({ children }: { children: ReactNode }) {
  const { getToken } = useAuth();
  const convex = useMemo(() => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!), []);

  return (
    <ConvexProviderWithClerk
      client={convex}
      useAuth={() => useAuth()}
    >
      {children}
    </ConvexProviderWithClerk>
  );
}

interface ConvexClientProviderProps {
  children: ReactNode;
}

export function ConvexClientProvider({ children }: ConvexClientProviderProps) {
  return (
    <ClerkProvider>
      <ConvexClientProviderClerk>
        {children}
      </ConvexClientProviderClerk>
    </ClerkProvider>
  );
}

