"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/features/auth/context/auth-context";

/*
 * Google callback — the backend sets httpOnly cookies and redirects here
 * (or directly to /dashboard). This page waits for the auth state to
 * resolve and redirects to the dashboard.
 */
export default function GoogleCallbackPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.replace("/dashboard");
    }

    if (!isLoading && !isAuthenticated) {
      router.replace("/auth/login");
    }
  }, [isLoading, isAuthenticated, router]);

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">
          Signing you in with Google...
        </p>
      </div>
    </div>
  );
}
