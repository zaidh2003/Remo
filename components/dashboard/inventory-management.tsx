"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { inventoryItems } from "@/lib/mock-data"
import { Package, AlertTriangle, CheckCircle, AlertCircle } from "lucide-react"

const statusConfig = {
  "in-stock": {
    color: "bg-success text-success-foreground",
    icon: CheckCircle,
    label: "In Stock",
  },
  low: {
    color: "bg-warning text-warning-foreground",
    icon: AlertCircle,
    label: "Low Stock",
  },
  critical: {
    color: "bg-destructive text-destructive-foreground",
    icon: AlertTriangle,
    label: "Critical",
  },
}

export function InventoryManagement() {
  const criticalCount = inventoryItems.filter((i) => i.status === "critical").length
  const lowCount = inventoryItems.filter((i) => i.status === "low").length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>Inventory Management</CardTitle>
            <CardDescription>Stock levels and reorder alerts</CardDescription>
          </div>
          <div className="flex gap-2">
            {criticalCount > 0 && (
              <Badge className="bg-destructive text-destructive-foreground gap-1">
                <AlertTriangle className="h-3 w-3" />
                {criticalCount} Critical
              </Badge>
            )}
            {lowCount > 0 && (
              <Badge className="bg-warning text-warning-foreground gap-1">
                <AlertCircle className="h-3 w-3" />
                {lowCount} Low
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg border">
          <table className="w-full">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left text-sm font-semibold">Item</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Category</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Stock Level</th>
                <th className="px-4 py-3 text-left text-sm font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {inventoryItems.map((item) => {
                const config = statusConfig[item.status]
                const Icon = config.icon
                const percentage = Math.min((item.quantity / item.minStock) * 100, 100)

                return (
                  <tr key={item.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary/10">
                          <Package className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{item.category}</td>
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span>
                            {item.quantity} {item.unit}
                          </span>
                          <span className="text-muted-foreground">min: {item.minStock}</span>
                        </div>
                        <Progress
                          value={percentage}
                          className={cn(
                            "h-2",
                            item.status === "critical" && "[&>div]:bg-destructive",
                            item.status === "low" && "[&>div]:bg-warning",
                            item.status === "in-stock" && "[&>div]:bg-success"
                          )}
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={cn("gap-1", config.color)}>
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </Badge>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
