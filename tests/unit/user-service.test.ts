/**
 * Unit tests for user-service.ts
 * Tests the reportSickLeave function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { reportSickLeave } from '@/lib/services/user-service'
import type { UserProfile } from '@/lib/services/user-service'
import type { SickLeaveType } from '@/lib/types'

// Mock the dependencies
vi.mock('@/lib/firebase', () => ({
  db: {}
}))

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  updateDoc: vi.fn(),
  collection: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  where: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  writeBatch: vi.fn(() => ({
    update: vi.fn(),
    commit: vi.fn()
  }))
}))

vi.mock('@/lib/services/data-service', () => ({
  getShiftsForEmployee: vi.fn(),
  sendNotification: vi.fn()
}))

describe('user-service: reportSickLeave', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should calculate current time automatically', async () => {
    const { getShiftsForEmployee, sendNotification } = await import('@/lib/services/data-service')
    const { addDoc } = await import('firebase/firestore')
    
    // Mock getShiftsForEmployee to return empty array
    vi.mocked(getShiftsForEmployee).mockResolvedValue([])
    
    // Mock addDoc to return a document reference
    vi.mocked(addDoc).mockResolvedValue({ id: 'alert123' } as any)
    
    const employee: UserProfile = {
      uid: 'emp123',
      email: 'test@example.com',
      name: 'Test Employee',
      role: 'EMPLOYEE',
      branch: 'main',
      createdAt: new Date()
    }
    
    const sickLeaveType: SickLeaveType = 'SUDDEN_ILLNESS'
    
    await reportSickLeave(
      employee,
      sickLeaveType,
      'Kitchen',
      'Monday',
      '09:00',
      '17:00',
      'Feeling unwell'
    )
    
    // Verify addDoc was called with current time (not the provided startTime)
    expect(addDoc).toHaveBeenCalled()
    const alertData = vi.mocked(addDoc).mock.calls[0][1]
    
    // The startTime should be current time, not '09:00'
    expect(alertData.startTime).not.toBe('09:00')
    expect(alertData.startTime).toMatch(/^\d{2}:\d{2}$/)
  })

  it('should mark all shifts as vacant using batch write', async () => {
    const { getShiftsForEmployee, sendNotification } = await import('@/lib/services/data-service')
    const { addDoc, writeBatch, doc } = await import('firebase/firestore')
    
    const mockBatch = {
      update: vi.fn(),
      commit: vi.fn()
    }
    
    // Mock getShiftsForEmployee to return multiple shifts
    vi.mocked(getShiftsForEmployee).mockResolvedValue([
      {
        id: 'shift1',
        staffId: 'emp123',
        staffName: 'Test Employee',
        branchId: 'main',
        zone: 'Kitchen',
        day: 'Monday',
        startTime: '09:00',
        endTime: '13:00',
        isEmergency: false,
        status: 'upcoming'
      },
      {
        id: 'shift2',
        staffId: 'emp123',
        staffName: 'Test Employee',
        branchId: 'main',
        zone: 'Kitchen',
        day: 'Monday',
        startTime: '14:00',
        endTime: '17:00',
        isEmergency: false,
        status: 'upcoming'
      }
    ])
    
    // Mock doc to return a document reference
    vi.mocked(doc).mockReturnValue({ id: 'mock-doc-ref' } as any)
    vi.mocked(writeBatch).mockReturnValue(mockBatch as any)
    vi.mocked(addDoc).mockResolvedValue({ id: 'alert123' } as any)
    
    const employee: UserProfile = {
      uid: 'emp123',
      email: 'test@example.com',
      name: 'Test Employee',
      role: 'EMPLOYEE',
      branch: 'main',
      createdAt: new Date()
    }
    
    await reportSickLeave(
      employee,
      'SUDDEN_ILLNESS',
      'Kitchen',
      'Monday',
      '09:00',
      '17:00',
      'Feeling unwell'
    )
    
    // Verify batch write was used
    expect(writeBatch).toHaveBeenCalled()
    expect(mockBatch.update).toHaveBeenCalledTimes(2)
    expect(mockBatch.commit).toHaveBeenCalled()
    
    // Verify each shift was updated with correct data
    expect(mockBatch.update).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        staffId: null,
        staffName: null,
        status: 'vacant'
      })
    )
  })

  it('should create shortage alert with HIGH priority for sudden illness', async () => {
    const { getShiftsForEmployee, sendNotification } = await import('@/lib/services/data-service')
    const { addDoc } = await import('firebase/firestore')
    
    vi.mocked(getShiftsForEmployee).mockResolvedValue([])
    vi.mocked(addDoc).mockResolvedValue({ id: 'alert123' } as any)
    
    const employee: UserProfile = {
      uid: 'emp123',
      email: 'test@example.com',
      name: 'Test Employee',
      role: 'EMPLOYEE',
      branch: 'main',
      createdAt: new Date()
    }
    
    await reportSickLeave(
      employee,
      'SUDDEN_ILLNESS',
      'Kitchen',
      'Monday',
      '09:00',
      '17:00',
      'Feeling unwell'
    )
    
    // Verify alert was created with HIGH priority
    expect(addDoc).toHaveBeenCalled()
    const alertData = vi.mocked(addDoc).mock.calls[0][1]
    
    expect(alertData.priority).toBe('HIGH')
    expect(alertData.sickLeaveType).toBe('SUDDEN_ILLNESS')
    expect(alertData.reason).toContain('🚨 Sudden illness')
  })

  it('should create shortage alert with NORMAL priority for other sick leave', async () => {
    const { getShiftsForEmployee, sendNotification } = await import('@/lib/services/data-service')
    const { addDoc } = await import('firebase/firestore')
    
    vi.mocked(getShiftsForEmployee).mockResolvedValue([])
    vi.mocked(addDoc).mockResolvedValue({ id: 'alert123' } as any)
    
    const employee: UserProfile = {
      uid: 'emp123',
      email: 'test@example.com',
      name: 'Test Employee',
      role: 'EMPLOYEE',
      branch: 'main',
      createdAt: new Date()
    }
    
    await reportSickLeave(
      employee,
      'OTHER',
      'Kitchen',
      'Monday',
      '09:00',
      '17:00',
      'Doctor appointment'
    )
    
    // Verify alert was created with NORMAL priority
    expect(addDoc).toHaveBeenCalled()
    const alertData = vi.mocked(addDoc).mock.calls[0][1]
    
    expect(alertData.priority).toBe('NORMAL')
    expect(alertData.sickLeaveType).toBe('OTHER')
    expect(alertData.reason).toContain('Sick leave')
  })

  it('should send notification to managers', async () => {
    const { getShiftsForEmployee, sendNotification } = await import('@/lib/services/data-service')
    const { addDoc } = await import('firebase/firestore')
    
    vi.mocked(getShiftsForEmployee).mockResolvedValue([
      {
        id: 'shift1',
        staffId: 'emp123',
        staffName: 'Test Employee',
        branchId: 'main',
        zone: 'Kitchen',
        day: 'Monday',
        startTime: '09:00',
        endTime: '13:00',
        isEmergency: false,
        status: 'upcoming'
      }
    ])
    vi.mocked(addDoc).mockResolvedValue({ id: 'alert123' } as any)
    
    const employee: UserProfile = {
      uid: 'emp123',
      email: 'test@example.com',
      name: 'Test Employee',
      role: 'EMPLOYEE',
      branch: 'main',
      createdAt: new Date()
    }
    
    await reportSickLeave(
      employee,
      'SUDDEN_ILLNESS',
      'Kitchen',
      'Monday',
      '09:00',
      '17:00',
      'Feeling unwell'
    )
    
    // Verify notification was sent
    expect(sendNotification).toHaveBeenCalledWith(
      'all',
      '🚨 Sick Leave Reported',
      expect.stringContaining('Test Employee'),
      'shortage'
    )
    
    // Verify notification includes shift count
    const notificationMessage = vi.mocked(sendNotification).mock.calls[0][2]
    expect(notificationMessage).toContain('1 shift(s) marked as vacant')
  })
})
