"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { staffData } from "@/lib/mock-data"
import { Star, DollarSign, AlertCircle } from "lucide-react"

const availabilityConfig = {
  available: {
    color: "bg-success text-success-foreground",
    label: "Available",
  },
  busy: {
    color: "bg-warning text-warning-foreground",
    label: "Busy",
  },
  off: {
    color: "bg-muted text-muted-foreground",
    label: "Off",
  },
}

export function StaffDirectory() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Staff Directory</CardTitle>
        <CardDescription>Team members and their availability status</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {staffData.map((staff) => {
            const availability = availabilityConfig[staff.availability]
            return (
              <div
                key={staff.id}
                className="rounded-xl border bg-card p-4 transition-shadow hover:shadow-lg"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="h-12 w-12 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                      {staff.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-foreground">{staff.name}</h3>
                    <p className="text-sm text-muted-foreground">{staff.role}</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <Badge className={cn("text-xs", availability.color)}>
                    {availability.label}
                  </Badge>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={cn(
                          "h-3 w-3",
                          i < staff.skillLevel ? "fill-primary text-primary" : "text-muted"
                        )}
                      />
                    ))}
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between text-sm">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>${staff.hourlyRate}/hr</span>
                  </div>
                </div>
                {staff.constraints && (
                  <div className="mt-3 flex items-start gap-1.5 rounded-md bg-warning/10 p-2 text-xs text-warning-foreground">
                    <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    <span>{staff.constraints}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
