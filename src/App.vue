<template>
  <div class="app" :class="{ dark: isDark }">
    <template v-if="!isLoginPage">
      <header class="header">
        <div class="logo">图书借阅系统</div>
        <div class="header-right">
          <span class="user">{{ auth.username }}</span>
          <router-link to="/account" class="header-link">账户设置</router-link>
          <button class="logout-btn" @click="doLogout">退出登录</button>
          <button class="theme-btn" @click="toggleDark">{{ isDark ? '浅色' : '深色' }}</button>
        </div>
      </header>
      <nav class="tabs">
        <router-link v-for="t in tabs" :key="t.key" :to="t.path" active-class="active">{{ t.label }}</router-link>
      </nav>
    </template>
    <main class="content" :class="{ 'login-content': isLoginPage }">
      <router-view />
    </main>
    <Toast />
    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'
import Toast from './components/Toast.vue'
import ConfirmDialog from './components/ConfirmDialog.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const isDark = ref(false)
const isLoginPage = computed(() => route.path === '/login')

const toggleDark = () => {
  isDark.value = !isDark.value
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
  document.body.classList.toggle('dark', isDark.value)
}

const doLogout = () => {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') { isDark.value = true; document.body.classList.add('dark') }
})

const tabs = [
  { key: 'dashboard', label: '首页概览', path: '/dashboard' },
  { key: 'readers', label: '读者管理', path: '/readers' },
  { key: 'books', label: '图书管理', path: '/books' },
  { key: 'borrow', label: '借书', path: '/borrow' },
  { key: 'return', label: '还书', path: '/return' },
  { key: 'borrows', label: '借阅记录', path: '/borrows' },
  { key: 'overdue', label: '逾期催还', path: '/overdue' },
  { key: 'logs', label: '操作日志', path: '/logs' },
]
</script>
