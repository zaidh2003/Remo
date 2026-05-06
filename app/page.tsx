"use client"

import { useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { RestaurantDashboard } from "@/components/dashboard/restaurant-dashboard"
import { LoginPage } from "@/components/auth/login-page"
import { useAuth } from "@/components/providers/auth-provider"
import { SiteLoader } from "@/components/ui/loader"

export default function Page() {
  const { user, profile, isLoading } = useAuth()
  const router = useRouter()
  const hasBeenLoggedIn = useRef(false)

  // Track if the user was ever logged in this session
  useEffect(() => {
    if (user) hasBeenLoggedIn.current = true
  }, [user])

  // Only redirect to landing for fresh visitors who have never been logged in
  // (i.e. not after a logout)
  useEffect(() => {
    if (!isLoading && !user && !hasBeenLoggedIn.current) {
      const params = new URLSearchParams(window.location.search)
      if (!params.has("login")) {
        router.replace("/landing")
      }
    }
  }, [user, isLoading, router])

  if (isLoading) {
    return <SiteLoader />
  }

  // After logout or with ?login param — show login form directly
  if (!user) {
    return <LoginPage />
  }

  return <RestaurantDashboard userProfile={profile} />
}
