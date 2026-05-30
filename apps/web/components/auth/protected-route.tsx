"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/auth-context";
import { MobiusLoopIcon } from "../ui/mobius-loop-icon";

interface ProtectedRouteProps {
  children: ReactNode;
  /** Optional fallback UI while checking auth state */
  loadingFallback?: ReactNode;
}

export function ProtectedRoute({
  children,
  loadingFallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return loadingFallback ? (
      <>{loadingFallback}</>
    ) : (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-2">
        <MobiusLoopIcon />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
