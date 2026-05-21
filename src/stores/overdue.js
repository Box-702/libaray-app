import { defineStore } from 'pinia'
import api from '../api'

export const useOverdueStore = defineStore('overdue', {
  state: () => ({
    list: [],
    page: 0,
    totalPages: 0,
    totalItems: 0,
    loading: false,
    error: null
  }),
  actions: {
    async load(page = 0) {
      this.loading = true
      this.error = null
      try {
        const r = await api.get('/overdue', { params: { page, size: 15 } })
        Object.assign(this, { list: r.data.items, page: r.data.page, totalPages: r.data.totalPages, totalItems: r.data.totalItems })
      } catch (e) {
        this.error = e.response?.data?.msg || '加载逾期数据失败'
      } finally {
        this.loading = false
      }
    }
  }
})

export const overdueDays = (d) => Math.floor((new Date() - new Date(d)) / (1000 * 60 * 60 * 24))
