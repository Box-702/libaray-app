import { createRouter, createWebHashHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/dashboard' },
  { path: '/dashboard', name: 'Dashboard', component: () => import('../views/Dashboard.vue') },
  { path: '/readers', name: 'Readers', component: () => import('../views/Readers.vue') },
  { path: '/books', name: 'Books', component: () => import('../views/Books.vue') },
  { path: '/borrow', name: 'Borrow', component: () => import('../views/Borrow.vue') },
  { path: '/return', name: 'Return', component: () => import('../views/ReturnBook.vue') },
  { path: '/borrows', name: 'Borrows', component: () => import('../views/BorrowList.vue') },
  { path: '/overdue', name: 'Overdue', component: () => import('../views/Overdue.vue') },
  { path: '/logs', name: 'Logs', component: () => import('../views/Logs.vue') }
]

export default createRouter({ history: createWebHashHistory(), routes })
