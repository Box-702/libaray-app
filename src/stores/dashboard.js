import { defineStore } from 'pinia'
import api from '../api'

export const useDashboardStore = defineStore('dashboard', {
  state: () => ({
    stats: { totalBooks: 0, availableBooks: 0, borrowedBooks: 0, totalReaders: 0, activeBorrows: 0, overdueCount: 0, recentLogs: [] },
    loading: false,
    error: null
  }),
  actions: {
    async load() {
      this.loading = true
      this.error = null
      try {
        const r = await api.get('/dashboard')
        this.stats = r.data
      } catch (e) {
        this.error = e.response?.data?.msg || '加载仪表盘失败'
      } finally {
        this.loading = false
      }
    }
  }
})
