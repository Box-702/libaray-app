<template>
  <div>
    <h3 style="margin-bottom:24px">账户设置</h3>
    <div class="card" style="max-width:480px">
      <h4 style="margin-bottom:4px;color:var(--text)">当前账户</h4>
      <p style="color:var(--text-secondary);font-size:13px;margin-bottom:20px">{{ auth.username }}</p>
      <hr style="border:0;border-top:1px solid var(--border);margin-bottom:20px"/>
      <h4 style="margin-bottom:16px;color:var(--text)">修改密码</h4>
      <div class="form-group">
        <label style="width:72px">原密码</label>
        <input v-model="form.oldPassword" type="password" placeholder="输入原密码"/>
      </div>
      <div class="form-group">
        <label style="width:72px">新密码</label>
        <input v-model="form.newPassword" type="password" placeholder="输入新密码（至少4位）"/>
      </div>
      <div class="form-group">
        <label style="width:72px">确认密码</label>
        <input v-model="form.confirmPassword" type="password" placeholder="再次输入新密码"/>
      </div>
      <button class="btn btn-primary" @click="doChange" :disabled="loading" style="margin-left:80px">{{ loading ? '修改中...' : '确认修改' }}</button>
      <div v-if="msg" :class="['msg', ok ? 'msg-success' : 'msg-error']" style="margin-top:16px;margin-bottom:0">{{ msg }}</div>
    </div>
  </div>
</template>
<script setup>
import { ref, reactive } from 'vue'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const form = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' })
const loading = ref(false)
const msg = ref('')
const ok = ref(null)

const doChange = async () => {
  msg.value = ''; ok.value = null
  if (!form.oldPassword || !form.newPassword) { msg.value = '请填写密码'; ok.value = false; return }
  if (form.newPassword.length < 4) { msg.value = '新密码至少4位'; ok.value = false; return }
  if (form.newPassword !== form.confirmPassword) { msg.value = '两次新密码不一致'; ok.value = false; return }
  loading.value = true
  try {
    const r = await auth.changePassword(form.oldPassword, form.newPassword)
    ok.value = r.ok
    msg.value = r.msg
    if (r.ok) { form.oldPassword = ''; form.newPassword = ''; form.confirmPassword = '' }
  } catch (e) {
    ok.value = false; msg.value = e.response?.data?.msg || '修改失败'
  } finally { loading.value = false }
}
</script>
