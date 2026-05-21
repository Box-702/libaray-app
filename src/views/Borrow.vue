<template>
  <div class="card">
    <h3 style="margin-bottom:16px">借书操作</h3>
    <div class="form-group"><label>借书证号</label><input v-model="cardNo" placeholder="如 R001"/></div>
    <div class="form-group"><label>书号</label><input v-model="bookId" placeholder="如 20017"/></div>
    <button class="btn btn-primary" @click="doBorrow" :disabled="loading" style="margin-left:88px">{{ loading ? '处理中...' : '确认借书' }}</button>
    <div v-if="msg" :class="['msg', ok ? 'msg-success' : 'msg-error']">{{ msg }}</div>
  </div>
</template>
<script setup>
import { ref } from 'vue'
import api from '../api/index.js'
const cardNo = ref(''), bookId = ref(''), msg = ref(''), ok = ref(false), loading = ref(false)
const doBorrow = async () => {
  loading.value = true; msg.value = ''
  try {
    const r = await api.post('/borrow', { cardNo: cardNo.value, bookId: bookId.value })
    ok.value = r.data.ok; msg.value = r.data.msg
  } catch (e) {
    ok.value = false; msg.value = '借书失败: ' + (e.response?.data?.msg || e.message)
  } finally { loading.value = false }
}
</script>
