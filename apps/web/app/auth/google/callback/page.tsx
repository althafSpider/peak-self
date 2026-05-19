"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"

export default function GoogleCallbackPage() {
  const params = useSearchParams()
  const router = useRouter()

  useEffect(() => {
    const accessToken = params.get("accessToken")
    const refreshToken = params.get("refreshToken")

    if (accessToken) localStorage.setItem("accessToken", accessToken)
    if (refreshToken) localStorage.setItem("refreshToken", refreshToken)

    router.push("/dashboard")
  }, [params, router])

  return <p>Signing you in with Google...</p>
}

