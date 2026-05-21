import { defineStore } from 'pinia'
import api from '../api'

export const useBooksStore = defineStore('books', {
  state: () => ({
    list: [],
    page: 0,
    totalPages: 0,
    totalItems: 0,
    loading: false,
    error: null,
    kw: ''
  }),
  actions: {
    async load(page = 0) {
      this.loading = true
      this.error = null
      try {
        const r = await api.get('/books', { params: { q: this.kw || undefined, page, size: 15 } })
        Object.assign(this, { list: r.data.items, page: r.data.page, totalPages: r.data.totalPages, totalItems: r.data.totalItems })
      } catch (e) {
        this.error = e.response?.data?.msg || '加载图书数据失败'
      } finally {
        this.loading = false
      }
    },
    async search(kw) { this.kw = kw; await this.load(0) },
    async save(data, editingId) {
      if (editingId) await api.put('/books/' + editingId, data)
      else await api.post('/books', data)
    },
    async remove(id) { await api.delete('/books/' + id) }
  }
})
