<template>
  <div>
    <h3 style="margin-bottom:16px">逾期未还图书</h3>
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-if="store.error" class="error-msg">{{ store.error }}</div>
    <div class="card" v-if="!store.loading && !store.error">
      <table><thead><tr><th>读者</th><th>电话</th><th>书名</th><th>借书日期</th><th>应还日期</th><th>逾期天数</th></tr></thead>
        <tbody><tr v-for="b in store.list" :key="b.borrowId">
          <td>{{ b.reader?.name }} ({{ b.cardNo }})</td><td>{{ b.reader?.phone }}</td><td>{{ b.book?.title }}</td>
          <td>{{ b.borrowDate }}</td><td>{{ b.dueDate }}</td>
          <td><span class="tag tag-red">{{ overdueDays(b.dueDate) }}天</span></td>
        </tr></tbody>
      </table>
      <p v-if="store.list.length === 0" class="empty-text">暂无逾期图书</p>
      <Pagination :page="store.page" :totalPages="store.totalPages" :totalItems="store.totalItems" @go="store.load"/>
    </div>
  </div>
</template>
<script setup>
import { onMounted } from 'vue'
import { useOverdueStore, overdueDays } from '../stores/overdue'
import Pagination from '../components/Pagination.vue'

const store = useOverdueStore()
onMounted(() => store.load())
</script>
