import { defineStore } from 'pinia'
import { ref } from 'vue'
import api from '../api'

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || '')
  const username = ref(localStorage.getItem('username') || '')
  const checked = ref(false)

  async function login(u, p) {
    const r = await api.post('/auth/login', { username: u, password: p })
    if (r.data.ok) {
      token.value = r.data.token
      username.value = r.data.username
      localStorage.setItem('token', r.data.token)
      localStorage.setItem('username', r.data.username)
    }
    return r.data
  }

  function logout() {
    token.value = ''
    username.value = ''
    localStorage.removeItem('token')
    localStorage.removeItem('username')
  }

  async function verify() {
    if (!token.value) { checked.value = true; return false }
    try {
      const r = await api.get('/auth/verify', { headers: { Authorization: token.value } })
      if (r.data.ok) {
        username.value = r.data.username
        checked.value = true
        return true
      }
    } catch (e) {
      logout()
    }
    checked.value = true
    return false
  }

  async function changePassword(oldPw, newPw) {
    const r = await api.post('/auth/change-password', { oldPassword: oldPw, newPassword: newPw }, { headers: { Authorization: token.value } })
    return r.data
  }

  return { token, username, checked, login, logout, verify, changePassword }
})
