/**
 * Unit tests for data-service.ts
 * Tests the getShiftsForEmployee helper function
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getShiftsForEmployee } from '@/lib/services/data-service'
import type { Shift } from '@/lib/types'

// Mock Firebase Firestore
vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
  addDoc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  doc: vi.fn(),
  onSnapshot: vi.fn(),
  serverTimestamp: vi.fn(() => new Date()),
  orderBy: vi.fn(),
}))

// Mock the db instance
vi.mock('@/lib/firebase', () => ({
  db: {},
  auth: {},
}))

describe('data-service: getShiftsForEmployee', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Basic Functionality', () => {
    it('should return empty array when no shifts match', async () => {
      const { getDocs } = await import('firebase/firestore')
      
      // Mock empty result
      vi.mocked(getDocs).mockResolvedValue({
        docs: [],
      } as any)

      const result = await getShiftsForEmployee('staff123', 'Monday', '09:00', '17:00')
      
      expect(result).toEqual([])
    })

    it('should filter shifts by date', async () => {
      const { getDocs } = await import('firebase/firestore')
      
      const mockShifts: Shift[] = [
        {
          id: '1',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Monday',
          startTime: '09:00',
          endTime: '17:00',
          isEmergency: false,
          status: 'upcoming',
        },
        {
          id: '2',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Tuesday',
          startTime: '09:00',
          endTime: '17:00',
          isEmergency: false,
          status: 'upcoming',
        },
      ]

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockShifts.map((shift) => ({
          id: shift.id,
          data: () => shift,
        })),
      } as any)

      const result = await getShiftsForEmployee('staff123', 'Monday', '09:00', '17:00')
      
      expect(result).toHaveLength(1)
      expect(result[0].day).toBe('Monday')
    })

    it('should filter shifts by time range', async () => {
      const { getDocs } = await import('firebase/firestore')
      
      const mockShifts: Shift[] = [
        {
          id: '1',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Monday',
          startTime: '09:00',
          endTime: '13:00',
          isEmergency: false,
          status: 'upcoming',
        },
        {
          id: '2',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Monday',
          startTime: '14:00',
          endTime: '18:00',
          isEmergency: false,
          status: 'upcoming',
        },
        {
          id: '3',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Monday',
          startTime: '19:00',
          endTime: '22:00',
          isEmergency: false,
          status: 'upcoming',
        },
      ]

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockShifts.map((shift) => ({
          id: shift.id,
          data: () => shift,
        })),
      } as any)

      // Query for shifts between 08:00 and 15:00
      const result = await getShiftsForEmployee('staff123', 'Monday', '08:00', '15:00')
      
      // Should include shifts 1 and 2 (overlapping with the range)
      // Shift 1: 09:00-13:00 overlaps with 08:00-15:00
      // Shift 2: 14:00-18:00 overlaps with 08:00-15:00
      // Shift 3: 19:00-22:00 does NOT overlap with 08:00-15:00
      expect(result).toHaveLength(2)
      expect(result.map(s => s.id)).toEqual(['1', '2'])
    })

    it('should sort shifts by day and time', async () => {
      const { getDocs } = await import('firebase/firestore')
      
      const mockShifts: Shift[] = [
        {
          id: '3',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Monday',
          startTime: '14:00',
          endTime: '18:00',
          isEmergency: false,
          status: 'upcoming',
        },
        {
          id: '1',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Monday',
          startTime: '09:00',
          endTime: '13:00',
          isEmergency: false,
          status: 'upcoming',
        },
        {
          id: '2',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Monday',
          startTime: '10:00',
          endTime: '14:00',
          isEmergency: false,
          status: 'upcoming',
        },
      ]

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockShifts.map((shift) => ({
          id: shift.id,
          data: () => shift,
        })),
      } as any)

      const result = await getShiftsForEmployee('staff123', 'Monday', '08:00', '20:00')
      
      // Should be sorted by startTime
      expect(result).toHaveLength(3)
      expect(result[0].id).toBe('1') // 09:00
      expect(result[1].id).toBe('2') // 10:00
      expect(result[2].id).toBe('3') // 14:00
    })
  })

  describe('Edge Cases', () => {
    it('should handle shifts that partially overlap with time range', async () => {
      const { getDocs } = await import('firebase/firestore')
      
      const mockShifts: Shift[] = [
        {
          id: '1',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Monday',
          startTime: '08:00',
          endTime: '12:00',
          isEmergency: false,
          status: 'upcoming',
        },
      ]

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockShifts.map((shift) => ({
          id: shift.id,
          data: () => shift,
        })),
      } as any)

      // Query for 10:00-14:00, shift is 08:00-12:00 (overlaps 10:00-12:00)
      const result = await getShiftsForEmployee('staff123', 'Monday', '10:00', '14:00')
      
      expect(result).toHaveLength(1)
      expect(result[0].id).toBe('1')
    })

    it('should exclude shifts that end exactly at range start', async () => {
      const { getDocs } = await import('firebase/firestore')
      
      const mockShifts: Shift[] = [
        {
          id: '1',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Monday',
          startTime: '08:00',
          endTime: '10:00',
          isEmergency: false,
          status: 'upcoming',
        },
      ]

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockShifts.map((shift) => ({
          id: shift.id,
          data: () => shift,
        })),
      } as any)

      // Query for 10:00-14:00, shift ends at 10:00 (no overlap)
      const result = await getShiftsForEmployee('staff123', 'Monday', '10:00', '14:00')
      
      expect(result).toHaveLength(0)
    })

    it('should exclude shifts that start exactly at range end', async () => {
      const { getDocs } = await import('firebase/firestore')
      
      const mockShifts: Shift[] = [
        {
          id: '1',
          staffId: 'staff123',
          staffName: 'John Doe',
          branchId: 'branch1',
          zone: 'KITCHEN',
          day: 'Monday',
          startTime: '14:00',
          endTime: '18:00',
          isEmergency: false,
          status: 'upcoming',
        },
      ]

      vi.mocked(getDocs).mockResolvedValue({
        docs: mockShifts.map((shift) => ({
          id: shift.id,
          data: () => shift,
        })),
      } as any)

      // Query for 10:00-14:00, shift starts at 14:00 (no overlap)
      const result = await getShiftsForEmployee('staff123', 'Monday', '10:00', '14:00')
      
      expect(result).toHaveLength(0)
    })
  })
})

describe('data-service: notifyShiftChange', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should send notification with "assigned" message', async () => {
    const { addDoc } = await import('firebase/firestore')
    const { notifyShiftChange } = await import('@/lib/services/data-service')
    
    const mockShift: Shift = {
      id: '1',
      staffId: 'staff123',
      staffName: 'John Doe',
      branchId: 'branch1',
      zone: 'KITCHEN',
      day: 'Monday',
      startTime: '09:00',
      endTime: '17:00',
      isEmergency: false,
      status: 'upcoming',
    }

    await notifyShiftChange('staff123', mockShift, 'assigned')
    
    expect(addDoc).toHaveBeenCalled()
    const callArgs = vi.mocked(addDoc).mock.calls[0]
    const notificationData = callArgs[1]
    
    expect(notificationData).toMatchObject({
      uid: 'staff123',
      title: 'Schedule Update',
      body: 'You have been assigned a KITCHEN shift on Monday from 09:00 to 17:00.',
      type: 'shift',
      read: false,
    })
  })

  it('should send notification with "modified" message', async () => {
    const { addDoc } = await import('firebase/firestore')
    const { notifyShiftChange } = await import('@/lib/services/data-service')
    
    const mockShift: Shift = {
      id: '1',
      staffId: 'staff123',
      staffName: 'John Doe',
      branchId: 'branch1',
      zone: 'BAR',
      day: 'Tuesday',
      startTime: '10:00',
      endTime: '18:00',
      isEmergency: false,
      status: 'upcoming',
    }

    await notifyShiftChange('staff123', mockShift, 'modified')
    
    expect(addDoc).toHaveBeenCalled()
    const callArgs = vi.mocked(addDoc).mock.calls[0]
    const notificationData = callArgs[1]
    
    expect(notificationData).toMatchObject({
      uid: 'staff123',
      title: 'Schedule Update',
      body: 'Your BAR shift on Tuesday has been updated to 10:00 - 18:00.',
      type: 'shift',
      read: false,
    })
  })

  it('should send notification with "removed" message', async () => {
    const { addDoc } = await import('firebase/firestore')
    const { notifyShiftChange } = await import('@/lib/services/data-service')
    
    const mockShift: Shift = {
      id: '1',
      staffId: 'staff123',
      staffName: 'John Doe',
      branchId: 'branch1',
      zone: 'HALL',
      day: 'Wednesday',
      startTime: '11:00',
      endTime: '19:00',
      isEmergency: false,
      status: 'vacant',
    }

    await notifyShiftChange('staff123', mockShift, 'removed')
    
    expect(addDoc).toHaveBeenCalled()
    const callArgs = vi.mocked(addDoc).mock.calls[0]
    const notificationData = callArgs[1]
    
    expect(notificationData).toMatchObject({
      uid: 'staff123',
      title: 'Schedule Update',
      body: 'Your HALL shift on Wednesday has been removed.',
      type: 'shift',
      read: false,
    })
  })
})
