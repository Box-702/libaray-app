import { defineStore } from 'pinia'

export const useConfirmStore = defineStore('confirm', {
  state: () => ({
    visible: false,
    title: '',
    message: '',
    resolveFn: null
  }),
  actions: {
    show(message, title = '确认操作') {
      return new Promise(resolve => {
        this.title = title
        this.message = message
        this.visible = true
        this.resolveFn = resolve
      })
    },
    answer(val) {
      this.visible = false
      if (this.resolveFn) {
        this.resolveFn(val)
        this.resolveFn = null
      }
    }
  }
})
