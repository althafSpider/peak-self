"use client";

import { ProtectedRoute } from "@/components/auth/protected-route";
import { useAuth } from "@/features/auth/context/auth-context";

export default function DashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  const { user, logout } = useAuth();

  return (
    <div className="flex min-h-svh flex-col">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <div className="flex items-center gap-4">
          {user && (
            <span className="text-sm text-muted-foreground">{user.email}</span>
          )}
          <button
            onClick={logout}
            className="rounded-full border px-4 py-1.5 text-sm font-medium transition-colors hover:bg-secondary"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 flex-col gap-6 p-6">
        <div className="rounded-2xl border p-6">
          <h2 className="text-xl font-semibold">Welcome back!</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            You are authenticated and your session is active.
          </p>
        </div>

        {user && (
          <div className="rounded-2xl border p-6">
            <h2 className="text-lg font-semibold mb-3">Profile</h2>
            <pre className="text-sm text-muted-foreground whitespace-pre-wrap">
              {JSON.stringify(user, null, 2)}
            </pre>
          </div>
        )}
      </main>
    </div>
  );
}
