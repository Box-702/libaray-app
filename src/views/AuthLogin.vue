<template>
  <div class="login-page">
    <div class="login-card">
      <h2 class="login-title">图书借阅系统</h2>
      <p class="login-sub">管理员登录</p>
      <div class="form-group" style="margin-bottom:16px">
        <label style="width:56px">账号</label>
        <input v-model="username" placeholder="请输入账号" @keyup.enter="doLogin" autofocus/>
      </div>
      <div class="form-group" style="margin-bottom:20px">
        <label style="width:56px">密码</label>
        <input v-model="password" type="password" placeholder="请输入密码" @keyup.enter="doLogin"/>
      </div>
      <button class="btn btn-primary" style="width:100%;padding:10px;font-size:14px" @click="doLogin" :disabled="loading">{{ loading ? '登录中...' : '登录' }}</button>
      <div v-if="msg" :class="['msg', ok === false ? 'msg-error' : 'msg-success']" style="margin-top:16px;margin-bottom:0">{{ msg }}</div>
    </div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const msg = ref('')
const ok = ref(null)

const doLogin = async () => {
  loading.value = true; msg.value = ''; ok.value = null
  try {
    const r = await auth.login(username.value, password.value)
    ok.value = r.ok
    msg.value = r.msg || ''
    if (r.ok) {
      setTimeout(() => router.push('/dashboard'), 200)
    }
  } catch (e) {
    ok.value = false
    msg.value = e.response?.data?.msg || '登录失败'
  } finally {
    loading.value = false
  }
}
</script>
<style scoped>
.login-page { min-height: 100vh; display: flex; align-items: center; justify-content: center; background: var(--bg); }
.login-card { background: var(--card-bg); border: 1px solid var(--border); border-radius: 8px; padding: 40px 36px; width: 400px; max-width: 90vw; box-shadow: 0 1px 3px rgba(0,0,0,.08); }
.login-title { font-size: 22px; font-weight: 600; text-align: center; margin-bottom: 4px; color: var(--text); }
.login-sub { font-size: 13px; color: var(--text-secondary); text-align: center; margin-bottom: 28px; }
</style>
