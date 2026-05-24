"use client"

import { useState } from "react"
import { Navbar } from "./navbar"
import { useLang } from "@/components/providers/language-provider"
import { DashboardOverview } from "./dashboard-overview"
import { WeeklyScheduler } from "./weekly-scheduler"
import { EmergencyBoard } from "./emergency-board"
import { TaxiManagement } from "./taxi-management"
import { StaffDirectory } from "./staff-directory"
import { InventoryManagement } from "./inventory-management"
import { TaskBoard } from "./task-board"
import { RoleManagement } from "@/components/auth/role-management"
import { UserManagement } from "@/components/dashboard/user-management"
import { ShortageAlerts } from "@/components/dashboard/shortage-alerts"
import { SwapRequests } from "@/components/dashboard/swap-requests"
import { BranchManagement } from "@/components/dashboard/branch-management"
import { DemoDataSeeder } from "@/components/dashboard/demo-data-seeder"
import type { UserProfile } from "@/lib/services/user-service"
import Image from "next/image"
import { Bell, LogOut } from "lucide-react"
import { ProfilePanel, SickLeaveModal } from "./profile-panel"

export function RestaurantDashboard({ userProfile }: { userProfile: UserProfile | null }) {
  const { t, lang } = useLang()
  const [activeTab, setActiveTab] = useState("dashboard")
  const [showProfile, setShowProfile] = useState(false)
  const [showSickLeave, setShowSickLeave] = useState(false)

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardOverview
            onNavigate={(tab) => {
              if (tab === "sick-leave") {
                setShowSickLeave(true)
              } else {
                setActiveTab(tab)
              }
            }}
          />
        )
      case "scheduler":
        return <WeeklyScheduler />
      case "tasks":
        return (
          <div className="max-w-6xl mx-auto">
            <TaskBoard />
          </div>
        )
      case "emergencies":
        return <EmergencyBoard />
      case "taxi":
        return <TaxiManagement />
      case "inventory":
        return (
          <div className="max-w-6xl mx-auto">
            <InventoryManagement />
          </div>
        )
      case "staff":
        return <StaffDirectory />
      case "settings":
        return (
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{t.settings}</h2>
            <RoleManagement />
          </div>
        )
      case "users":
        return (
          <div className="max-w-5xl mx-auto">
            <UserManagement />
          </div>
        )
      case "shortage":
        return (
          <div className="max-w-4xl mx-auto">
            <ShortageAlerts />
          </div>
        )
      case "swaps":
        return (
          <div className="max-w-4xl mx-auto">
            <SwapRequests />
          </div>
        )
      case "branches":
        return (
          <div className="max-w-5xl mx-auto space-y-6">
            <DemoDataSeeder />
            <BranchManagement />
          </div>
        )
      default:
        return <DashboardOverview onNavigate={setActiveTab} />
    }
  }

  const getPageTitle = () => {
    switch (activeTab) {
      case "dashboard": return t.dashboard
      case "scheduler": return t.scheduler
      case "tasks": return t.tasks
      case "emergencies": return t.emergencies
      case "taxi": return t.taxi
      case "inventory": return t.inventory
      case "staff": return t.staff
      case "settings": return t.settings
      case "users": return t.users
      case "shortage": return t.shortage
      case "swaps": return t.swapRequests
      case "branches": return t.branchManagement
      default: return t.dashboard
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground pb-24 font-sans selection:bg-primary/30">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4 md:px-8 mx-auto">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-primary/20">
              <Image src="/Logo.jpg" alt="REMO" width={40} height={40} className="object-cover" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">REMO</h1>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">Management System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-full hover:bg-muted transition-colors relative">
              <Bell className="h-5 w-5" />
              <span className="absolute top-1.5 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
            </button>
            <div 
              onClick={() => setShowProfile(true)}
              className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold shadow-md cursor-pointer hover:opacity-90 transition-opacity"
              title="Your Profile"
            >
              {userProfile?.name ? userProfile.name.charAt(0).toUpperCase() : <LogOut className="h-4 w-4" />}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 container max-w-screen-2xl mx-auto px-4 md:px-8 py-8">
        <header className="mb-8 flex justify-between items-end">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">{getPageTitle()}</h2>
            <p className="text-muted-foreground mt-1" suppressHydrationWarning>
              {new Date().toLocaleDateString(lang === "ru" ? "ru-RU" : lang === "lv" ? "lv-LV" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
          
          {userProfile && (
            <div className="hidden md:flex flex-col items-end">
              <span className="text-sm font-medium">{t.welcome}, {userProfile.name}</span>
              <span className="text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full mt-1">
                {userProfile.role}
              </span>
            </div>
          )}
        </header>
        
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderContent()}
        </div>
      </main>

      {/* New Floating Navbar */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} userRole={userProfile?.role} />

      {/* Profile Panel */}
      {showProfile && <ProfilePanel onClose={() => setShowProfile(false)} />}

      {/* Sick Leave Modal */}
      {showSickLeave && <SickLeaveModal onClose={() => setShowSickLeave(false)} />}
    </div>
  )
}
