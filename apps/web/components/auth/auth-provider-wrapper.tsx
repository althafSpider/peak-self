"use client";

import { type ReactNode } from "react";
import { AuthProvider } from "@/features/auth/context/auth-context";

export function AuthProviderWrapper({ children }: { children: ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
