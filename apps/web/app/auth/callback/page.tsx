"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/features/auth/context/auth-context";

export default function CallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
      }
    >
      <CallbackContent />
    </Suspense>
  );
}

function CallbackContent() {
  const params = useSearchParams();
  const { verifyMagicLink } = useAuth();
  const [status, setStatus] = useState<"loading" | "verifying" | "error">(
    "loading"
  );

  useEffect(() => {
    const token = params.get("token");

    if (!token) {
      const timer = setTimeout(() => {
        const retryToken = params.get("token");
        if (!retryToken) {
          setStatus("error");
        }
      }, 100);
      return () => clearTimeout(timer);
    }

    setStatus("verifying");

    verifyMagicLink(token).catch(() => {
      setStatus("error");
    });
  }, [params, verifyMagicLink]);

  if (status === "error") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="rounded-full bg-destructive/10 p-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-6 text-destructive"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold">Invalid or expired link</h1>
          <p className="text-sm text-muted-foreground max-w-sm">
            This magic link is invalid or has expired. Please request a new one.
          </p>
          <a
            href="/auth/login"
            className="mt-2 text-sm font-medium text-primary underline underline-offset-4 hover:text-primary/80"
          >
            Back to login
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="text-sm text-muted-foreground">Signing you in...</p>
      </div>
    </div>
  );
}
