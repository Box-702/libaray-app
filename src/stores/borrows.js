import { defineStore } from 'pinia'
import api from '../api'

export const useBorrowsStore = defineStore('borrows', {
  state: () => ({
    list: [],
    page: 0,
    totalPages: 0,
    totalItems: 0,
    loading: false,
    error: null,
    cardNo: ''
  }),
  actions: {
    async load(page = 0) {
      this.loading = true
      this.error = null
      try {
        const r = await api.get('/borrows', { params: { cardNo: this.cardNo || undefined, page, size: 15 } })
        Object.assign(this, { list: r.data.items, page: r.data.page, totalPages: r.data.totalPages, totalItems: r.data.totalItems })
      } catch (e) {
        this.error = e.response?.data?.msg || '加载借阅记录失败'
      } finally {
        this.loading = false
      }
    },
    async filter(cardNo) { this.cardNo = cardNo; await this.load(0) }
  }
})
