"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RestaurantDashboard } from "@/components/dashboard/restaurant-dashboard"
import { LoginPage } from "@/components/auth/login-page"
import { useAuth } from "@/components/providers/auth-provider"

export default function Page() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  // Redirect unauthenticated visitors to landing page
  useEffect(() => {
    if (!isLoading && !user) {
      // Check if they came from the landing page CTA (has ?login param) — if so show login directly
      const params = new URLSearchParams(window.location.search)
      if (!params.has("login")) {
        router.replace("/landing")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <RestaurantDashboard userProfile={profile} />
}
