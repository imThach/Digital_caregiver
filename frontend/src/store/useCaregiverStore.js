import { create } from 'zustand'
import { pairingApi, medicationApi } from '../api/apiServices'

export const useCaregiverStore = create((set, get) => ({
  user: null,
  elderlyList: [],
  selectedElderly: null,
  dashboardStats: null,
  isLoading: false,
  error: null,

  setUser: (user) => set({ user }),

  setSelectedElderly: (elderly) => set({ selectedElderly: elderly }),

  fetchElderlyList: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await pairingApi.getMyElderly()
      const list = response.data || []
      set({ elderlyList: list, isLoading: false })
      
      // Auto select first elderly if none selected yet
      if (list.length > 0 && !get().selectedElderly) {
        set({ selectedElderly: list[0] })
      }
      return list
    } catch (err) {
      set({ error: err.message, isLoading: false })
      return []
    }
  },

  fetchDashboardStatus: async () => {
    try {
      const response = await medicationApi.getCaregiverDashboardStatus()
      set({ dashboardStats: response.data })
      return response.data
    } catch (err) {
      console.error('Failed to fetch caregiver dashboard status:', err)
      return null
    }
  },

  updateElderlyInList: (updatedElderly) => {
    const list = get().elderlyList.map((item) =>
      item._id === updatedElderly._id ? { ...item, ...updatedElderly } : item
    )
    set({ elderlyList: list })
    if (get().selectedElderly?._id === updatedElderly._id) {
      set({ selectedElderly: { ...get().selectedElderly, ...updatedElderly } })
    }
  },
}))

export default useCaregiverStore
