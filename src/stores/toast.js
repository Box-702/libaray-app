import { defineStore } from 'pinia'

let id = 0

export const useToastStore = defineStore('toast', {
  state: () => ({ messages: [] }),
  actions: {
    add(text, type = 'info', duration = 3000) {
      const msg = { id: ++id, text, type }
      this.messages.push(msg)
      setTimeout(() => {
        const idx = this.messages.findIndex(m => m.id === msg.id)
        if (idx > -1) this.messages.splice(idx, 1)
      }, duration)
    },
    success(text) { this.add(text, 'success') },
    error(text) { this.add(text, 'error', 5000) },
    info(text) { this.add(text, 'info') }
  }
})
