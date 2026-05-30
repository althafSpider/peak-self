import { ProtectedRoute } from "@/components/auth/protected-route"
import ModeToggle from "@/components/layout/mode-toggle"

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
       <ProtectedRoute>
        <ModeToggle/>
        {children}
       </ProtectedRoute>
  )
}