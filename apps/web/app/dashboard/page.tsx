"use client"

import { useEffect, useMemo, useState } from "react"

type MeResponse = {
  userId: string
  sessionId: string | null
}

export default function DashboardPage() {
  const [me, setMe] = useState<MeResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const accessToken = useMemo(() => {
    if (typeof window === "undefined") return null
    return localStorage.getItem("accessToken")
  }, [])

  useEffect(() => {
    async function load() {
      if (!accessToken) {
        setError("Missing access token. Open the magic link again.")
        return
      }

      const res = await fetch("http://localhost:5000/api/auth/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      if (!res.ok) {
        setError(`Auth failed (${res.status}).`)
        return
      }

      setMe((await res.json()) as MeResponse)
    }

    load()
  }, [accessToken])

  if (error) return <pre>{error}</pre>
  if (!me) return <p>Loading...</p>

  return (
    <div style={{ padding: 24 }}>
      <h1>Authenticated</h1>
      <pre>{JSON.stringify(me, null, 2)}</pre>
    </div>
  )
}
