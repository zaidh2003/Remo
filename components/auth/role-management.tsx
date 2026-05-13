"use client"

import { useState } from "react"
import { Shield, Plus, Edit2, Trash2, Check, X } from "lucide-react"
import type { Role, UserRole, Permission } from "@/lib/auth-types"
import { rolePermissions } from "@/lib/auth-types"

interface RoleManagementProps {
  onRoleUpdate?: (role: Role) => void
}

const defaultRoles: Role[] = [
  {
    id: "1",
    name: "admin",
    description: "Full system access and control",
    permissions: rolePermissions.admin,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "2",
    name: "manager",
    description: "Manage staff and view reports",
    permissions: rolePermissions.manager,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "3",
    name: "employee",
    description: "Standard staff member access",
    permissions: rolePermissions.employee,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

export function RoleManagement({ onRoleUpdate }: RoleManagementProps) {
  const [roles, setRoles] = useState<Role[]>(defaultRoles)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [isEditing, setIsEditing] = useState(false)

  const handlePermissionToggle = (roleId: string, permissionId: string) => {
    setRoles(
      roles.map((role) => {
        if (role.id === roleId) {
          const hasPermission = role.permissions.some((p) => p.id === permissionId)
          return {
            ...role,
            permissions: hasPermission
              ? role.permissions.filter((p) => p.id !== permissionId)
              : [
                  ...role.permissions,
                  rolePermissions[role.name as UserRole].find((p) => p.id === permissionId)!,
                ],
          }
        }
        return role
      })
    )
  }

  const handleSaveRole = (updatedRole: Role) => {
    setRoles(roles.map((r) => (r.id === updatedRole.id ? updatedRole : r)))
    setIsEditing(false)
    onRoleUpdate?.(updatedRole)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-primary/10 p-2">
            <Shield className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Role Management</h2>
            <p className="text-sm text-muted-foreground">Configure roles and permissions</p>
          </div>
        </div>
        <button className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors">
          <Plus className="h-4 w-4" />
          Add Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="space-y-3">
          {roles.map((role) => (
            <div
              key={role.id}
              onClick={() => setSelectedRole(role)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                selectedRole?.id === role.id
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50 bg-card"
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold capitalize">{role.name}</p>
                  <p className="text-xs text-muted-foreground">{role.permissions.length} permissions</p>
                </div>
                <div className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-medium">
                  {role.name}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Role Details */}
        <div className="lg:col-span-2">
          {selectedRole ? (
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold capitalize">{selectedRole.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedRole.description}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button className="p-2 hover:bg-destructive/10 rounded-lg transition-colors text-destructive">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="space-y-4">
                <h4 className="font-semibold">Permissions</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {rolePermissions[selectedRole.name as UserRole].map((permission) => (
                    <div
                      key={permission.id}
                      className="flex items-start gap-3 p-3 bg-muted/50 border border-border/50 rounded-lg"
                    >
                      <input
                        type="checkbox"
                        checked={selectedRole.permissions.some((p) => p.id === permission.id)}
                        onChange={() => {
                          if (isEditing) {
                            handlePermissionToggle(selectedRole.id, permission.id)
                          }
                        }}
                        disabled={!isEditing}
                        className="mt-1 w-4 h-4 rounded border-border cursor-pointer"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{permission.name}</p>
                        <p className="text-xs text-muted-foreground">{permission.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              {isEditing && (
                <div className="flex gap-3 pt-4 border-t border-border">
                  <button
                    onClick={() => handleSaveRole(selectedRole)}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                  >
                    <Check className="h-4 w-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="flex-1 flex items-center justify-center gap-2 bg-muted text-foreground px-4 py-2 rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-lg p-12 flex flex-col items-center justify-center text-center">
              <Shield className="h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Select a role to view permissions</p>
            </div>
          )}
        </div>
      </div>

      {/* Permission Matrix */}
      <div className="bg-card border border-border rounded-lg p-6">
        <h3 className="text-lg font-bold mb-4">Permission Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-2 px-3 font-semibold">Role</th>
                <th className="text-center py-2 px-3 font-semibold">Create</th>
                <th className="text-center py-2 px-3 font-semibold">Read</th>
                <th className="text-center py-2 px-3 font-semibold">Update</th>
                <th className="text-center py-2 px-3 font-semibold">Delete</th>
              </tr>
            </thead>
            <tbody>
              {roles.map((role) => (
                <tr key={role.id} className="border-b border-border hover:bg-muted/50 transition-colors">
                  <td className="py-3 px-3 font-medium capitalize">{role.name}</td>
                  {["create", "read", "update", "delete"].map((action) => {
                    const hasPermission = role.permissions.some(
                      (p) => p.action === action
                    )
                    return (
                      <td key={action} className="py-3 px-3 text-center">
                        {hasPermission ? (
                          <Check className="h-4 w-4 text-green-600 mx-auto" />
                        ) : (
                          <X className="h-4 w-4 text-red-600 mx-auto" />
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
