import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  { path: '/login', name: 'Login', component: () => import('../views/AuthLogin.vue'), meta: { guest: true } },
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/readers', name: 'Readers', component: () => import('../views/Readers.vue') },
  { path: '/books', name: 'Books', component: () => import('../views/Books.vue') },
  { path: '/borrow', name: 'Borrow', component: () => import('../views/Borrow.vue') },
  { path: '/return', name: 'Return', component: () => import('../views/ReturnBook.vue') },
  { path: '/borrows', name: 'Borrows', component: () => import('../views/BorrowList.vue') },
  { path: '/overdue', name: 'Overdue', component: () => import('../views/Overdue.vue') },
  { path: '/account', name: 'Account', component: () => import('../views/Account.vue') },
  { path: '/logs', name: 'Logs', component: () => import('../views/Logs.vue') }
]

const router = createRouter({ history: createWebHashHistory(), routes })

router.beforeEach(async (to, from) => {
  const auth = useAuthStore()

  if (!auth.checked) {
    await auth.verify()
  }

  if (to.meta.guest) {
    if (auth.token) return '/dashboard'
    return true
  }

  if (!auth.token) return '/login'
  return true
})

export default router
