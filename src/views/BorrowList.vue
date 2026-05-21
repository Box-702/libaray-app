<template>
  <div>
    <div class="search-bar"><input v-model="filterCardNo" placeholder="输入借书证号筛选..." @input="onFilter"/></div>
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-if="store.error" class="error-msg">{{ store.error }}</div>
    <div class="card" v-if="!store.loading && !store.error">
      <table><thead><tr><th>借阅编号</th><th>读者</th><th>书名</th><th>借书日期</th><th>应还日期</th><th>还书日期</th><th>状态</th></tr></thead>
        <tbody><tr v-for="b in store.list" :key="b.borrowId">
          <td>{{ b.borrowId }}</td>
          <td>{{ b.reader?.name }} ({{ b.cardNo }})</td>
          <td>{{ b.book?.title }}</td>
          <td>{{ b.borrowDate }}</td>
          <td>{{ b.dueDate }}</td>
          <td>{{ b.returnDate || '-' }}</td>
          <td><span :class="['tag', b.status === '0' ? 'tag-red' : 'tag-green']">{{ b.status === '0' ? '未还' : '已还' }}</span></td>
        </tr></tbody>
      </table>
      <Pagination :page="store.page" :totalPages="store.totalPages" :totalItems="store.totalItems" @go="store.load"/>
    </div>
    <div style="margin-top:8px">
      <button class="btn" @click="doExport">导出CSV</button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useBorrowsStore } from '../stores/borrows'
import { useToastStore } from '../stores/toast'
import Pagination from '../components/Pagination.vue'
import api from '../api'

const store = useBorrowsStore()
const toast = useToastStore()
const filterCardNo = ref('')

const onFilter = () => store.filter(filterCardNo.value)
const doExport = async () => {
  const r = await api.get('/export/borrows', { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = 'borrows.csv'; a.click()
  URL.revokeObjectURL(url)
  toast.success('导出成功')
}
onMounted(() => store.load())
</script>
