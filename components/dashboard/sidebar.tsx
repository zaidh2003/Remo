"use client"

import Image from "next/image"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  Users,
  Package,
  TrendingDown,
  ChevronRight,
} from "lucide-react"

interface SidebarProps {
  activeTab: string
  setActiveTab: (tab: string) => void
  isOpen?: boolean
}

const navItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "scheduler", label: "Smart Scheduler", icon: Calendar },
  { id: "forecast", label: "Demand Forecast", icon: TrendingUp },
  { id: "staff", label: "Staff Directory", icon: Users },
  { id: "inventory", label: "Inventory Management", icon: Package },
]

export function Sidebar({ activeTab, setActiveTab, isOpen = true }: SidebarProps) {
  return (
    <aside className={cn(
      "fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-gradient-to-b from-card to-sidebar border-r border-border transition-transform duration-300 lg:translate-x-0",
      !isOpen && "-translate-x-full"
    )}>
      {/* Logo Section */}
      <div className="flex items-center gap-3 border-b border-border px-6 py-6 mt-16">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-blue-600 shadow-lg">
          <ChefHat className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="text-lg font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">RestaurantOS</h1>
          <p className="text-xs text-muted-foreground">Management</p>
        </div>
      </div>

      {/* Navigation Section */}
      <nav className="flex-1 px-4 py-6">
        <div className="mb-4">
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Main Menu</p>
        </div>
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "group relative flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200",
                  activeTab === item.id
                    ? "bg-gradient-to-r from-primary/20 to-blue-500/20 text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-sidebar/50"
                )}
              >
                {activeTab === item.id && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-blue-500/10 rounded-lg" />
                )}
                <item.icon className={cn(
                  "h-5 w-5 transition-transform",
                  activeTab === item.id && "scale-110"
                )} />
                <span className="flex-1 text-left">{item.label}</span>
                {activeTab === item.id && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* Stats Section */}
      <div className="border-t border-border p-4 space-y-4">
        <div className="rounded-lg bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground">Labor Cost</p>
              <p className="mt-1 text-2xl font-bold">$1,247</p>
            </div>
            <div className="rounded-lg bg-green-500/20 p-2">
              <TrendingDown className="h-5 w-5 text-green-500" />
            </div>
          </div>
          <p className="mt-2 text-xs text-green-600 font-semibold flex items-center gap-1">
            <span>↓</span> 8% vs last week
          </p>
        </div>

        <div className="rounded-lg bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 p-4">
          <p className="text-xs font-medium text-muted-foreground">Staff On Duty</p>
          <p className="mt-1 text-2xl font-bold">12</p>
          <p className="mt-2 text-xs text-blue-600 font-semibold">+2 from yesterday</p>
        </div>
      </div>
    </aside>
  )
}
