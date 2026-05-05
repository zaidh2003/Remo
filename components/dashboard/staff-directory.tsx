"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { getAllUsers, type UserProfile } from "@/lib/services/user-service"
import { Star, Loader2, RefreshCw } from "lucide-react"
import type { SkillLevel } from "@/lib/types"

const levelStars: Record<SkillLevel, number> = {
  Beginner: 1, Intermediate: 2, Expert: 3,
}

const roleColor: Record<string, string> = {
  ADMIN:    "bg-red-500/15 text-red-400",
  MANAGER:  "bg-blue-500/15 text-blue-400",
  EMPLOYEE: "bg-green-500/15 text-green-400",
}

export function StaffDirectory() {
  const [staff, setStaff]     = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const all = await getAllUsers()
      setStaff(all)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Staff Directory</CardTitle>
            <CardDescription>All registered team members and their skills</CardDescription>
          </div>
          <button onClick={load} disabled={loading}
            className="p-2 rounded-xl border border-border hover:bg-muted transition-colors disabled:opacity-50">
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : staff.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">No staff found.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {staff.map((member) => {
              const initials = (member.name ?? member.email ?? "?")
                .split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)

              // Max proficiency across all skills for star display
              const topSkillStars = member.skills && member.skills.length > 0
                ? Math.max(...member.skills.map((s) => levelStars[s.level] ?? 1))
                : 0

              return (
                <div key={member.uid}
                  className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-lg space-y-3">
                  {/* Avatar + name */}
                  <div className="flex items-start gap-3">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-foreground text-sm">
                        {member.name || "—"}
                      </h3>
                      <p className="text-xs text-muted-foreground truncate">
                        {member.position || member.email}
                      </p>
                    </div>
                  </div>

                  {/* Role + branch */}
                  <div className="flex items-center justify-between gap-2">
                    <Badge className={cn("text-xs", roleColor[member.role] ?? "bg-muted text-muted-foreground")}>
                      {member.role}
                    </Badge>
                    {member.branch && (
                      <span className="text-xs text-muted-foreground truncate">{member.branch}</span>
                    )}
                  </div>

                  {/* Skill stars */}
                  {topSkillStars > 0 && (
                    <div className="flex items-center gap-0.5">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <Star key={i} className={cn("h-3 w-3",
                          i < topSkillStars ? "fill-primary text-primary" : "text-muted"
                        )} />
                      ))}
                      <span className="text-xs text-muted-foreground ml-1">
                        {member.skills?.[0]?.level}
                      </span>
                    </div>
                  )}

                  {/* Skill zones */}
                  {member.skills && member.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {member.skills.map((s) => (
                        <span key={s.zone}
                          className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">
                          {s.zone}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Phone */}
                  {member.phone && (
                    <p className="text-xs text-muted-foreground">{member.phone}</p>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
