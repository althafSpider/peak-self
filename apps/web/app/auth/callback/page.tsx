"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function CallbackPage() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    async function verify() {
      const token = params.get("token")

      if (!token) return

      const res = await fetch("http://localhost:5000/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (res.ok) {
        const data = (await res.json()) as {
          accessToken?: string
          refreshToken?: string
        }

        if (data.accessToken) {
          localStorage.setItem("accessToken", data.accessToken)
        }
        if (data.refreshToken) {
          localStorage.setItem("refreshToken", data.refreshToken)
        }

        router.push("/dashboard")
        return
      }
    }

    verify()
  }, [params, router])

  return <p>Signing you in...</p>
}
