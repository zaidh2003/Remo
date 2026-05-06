"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { RestaurantDashboard } from "@/components/dashboard/restaurant-dashboard"
import { LoginPage } from "@/components/auth/login-page"
import { useAuth } from "@/components/providers/auth-provider"
import { SiteLoader } from "@/components/ui/loader"

export default function Page() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (isLoading) return

    if (user) {
      // Clear the "just logged out" flag when user is authenticated
      sessionStorage.removeItem("remo_logged_out")
      return
    }

    // User is not logged in
    const justLoggedOut = sessionStorage.getItem("remo_logged_out") === "true"
    const hasLoginParam = new URLSearchParams(window.location.search).has("login")

    // Only redirect to landing for fresh visitors — not after a logout
    if (!justLoggedOut && !hasLoginParam) {
      router.replace("/landing")
    }
  }, [user, isLoading, router])

  if (isLoading) return <SiteLoader />
  if (!user) return <LoginPage />
  return <RestaurantDashboard userProfile={profile} />
}
