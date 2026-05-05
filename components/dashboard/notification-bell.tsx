"use client"

import { useEffect, useRef, useState } from "react"
import { Bell, X, CheckCheck, AlertTriangle, Car, Calendar, Sparkles, Info } from "lucide-react"
import { subscribeToNotifications, markNotificationRead, type AppNotification } from "@/lib/services/data-service"
import { useAuth } from "@/components/providers/auth-provider"

const typeIcon: Record<AppNotification["type"], any> = {
  shortage: AlertTriangle,
  swap:     Calendar,
  taxi:     Car,
  shift:    Calendar,
  general:  Info,
}

const typeColor: Record<AppNotification["type"], string> = {
  shortage: "text-red-500 bg-red-500/10",
  swap:     "text-blue-500 bg-blue-500/10",
  taxi:     "text-orange-500 bg-orange-500/10",
  shift:    "text-primary bg-primary/10",
  general:  "text-muted-foreground bg-muted",
}

export function NotificationBell() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!profile) return
    const unsub = subscribeToNotifications(profile.uid, setNotifications)
    return () => unsub()
  }, [profile?.uid])

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const unread = notifications.filter((n) => !n.read)

  const handleMarkAll = async () => {
    await Promise.all(unread.map((n) => markNotificationRead(n.id)))
  }

  const handleMarkOne = async (id: string) => {
    await markNotificationRead(id)
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-muted transition-colors relative"
      >
        <Bell className="h-5 w-5" />
        {unread.length > 0 && (
          <span className="absolute top-1 right-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-card border border-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="font-semibold text-sm">Notifications</h3>
            <div className="flex items-center gap-2">
              {unread.length > 0 && (
                <button onClick={handleMarkAll}
                  className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 transition-colors">
                  <CheckCheck className="h-3.5 w-3.5" /> Mark all read
                </button>
              )}
              <button onClick={() => setOpen(false)}
                className="p-1 rounded-lg hover:bg-muted transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* List */}
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcon[n.type] ?? Info
                return (
                  <div
                    key={n.id}
                    onClick={() => !n.read && handleMarkOne(n.id)}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-muted/40 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                  >
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${typeColor[n.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium leading-tight ${!n.read ? "text-foreground" : "text-muted-foreground"}`}>
                        {n.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
                    </div>
                    {!n.read && (
                      <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
