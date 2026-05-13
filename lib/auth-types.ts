// Authentication and Authorization Types

export type UserRole = 'admin' | 'manager' | 'employee'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  restaurantId: string
  avatar?: string
  createdAt: Date
  lastLogin?: Date
  permissions: Permission[]
}

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: 'create' | 'read' | 'update' | 'delete'
}

export interface Role {
  id: string
  name: UserRole
  description: string
  permissions: Permission[]
  createdAt: Date
  updatedAt: Date
}

export interface Restaurant {
  id: string
  name: string
  address: string
  phone: string
  email: string
  owner: string
  createdAt: Date
  users: User[]
}

export interface AuthSession {
  user: User
  restaurant: Restaurant
  token: string
  expiresAt: Date
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface SignupData {
  email: string
  password: string
  name: string
  restaurantName: string
}

// Role Permissions Matrix
export const rolePermissions: Record<UserRole, Permission[]> = {
  admin: [
    { id: '1', name: 'Manage All', description: 'Full system access', resource: '*', action: 'create' },
    { id: '2', name: 'Manage All', description: 'Full system access', resource: '*', action: 'read' },
    { id: '3', name: 'Manage All', description: 'Full system access', resource: '*', action: 'update' },
    { id: '4', name: 'Manage All', description: 'Full system access', resource: '*', action: 'delete' },
  ],
  manager: [
    { id: '5', name: 'View Dashboard', description: 'Access main dashboard', resource: 'dashboard', action: 'read' },
    { id: '6', name: 'Manage Staff', description: 'View and edit staff schedules', resource: 'staff', action: 'read' },
    { id: '7', name: 'Edit Schedules', description: 'Create and modify schedules', resource: 'schedules', action: 'update' },
    { id: '8', name: 'View Reports', description: 'Access analytics and reports', resource: 'reports', action: 'read' },
  ],
  employee: [
    { id: '9', name: 'View Schedule', description: 'Check personal schedule', resource: 'schedule', action: 'read' },
    { id: '10', name: 'View Tasks', description: 'View assigned tasks', resource: 'tasks', action: 'read' },
    { id: '11', name: 'Update Tasks', description: 'Mark tasks complete', resource: 'tasks', action: 'update' },
    { id: '12', name: 'Manage Swaps', description: 'Create swap requests', resource: 'swaps', action: 'create' },
  ],
}
