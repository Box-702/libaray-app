<template>
  <div>
    <h3 style="margin-bottom:16px">操作日志</h3>
    <div v-if="loading" class="loading">加载中...</div>
    <div class="card" v-if="!loading">
      <table><thead><tr><th>#</th><th>时间</th><th>操作</th><th>详情</th></tr></thead>
        <tbody><tr v-for="l in list" :key="l.id"><td>{{ l.id }}</td><td>{{ l.time }}</td><td>{{ l.action }}</td><td>{{ l.detail }}</td></tr></tbody>
      </table>
      <Pagination :page="page" :totalPages="totalPages" :totalItems="totalItems" @go="load"/>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import api from '../api'
import Pagination from '../components/Pagination.vue'

const list = ref([]), page = ref(0), totalPages = ref(0), totalItems = ref(0), loading = ref(false)

const load = async (p = 0) => {
  loading.value = true
  try {
    const r = await api.get('/logs', { params: { page: p, size: 20 } })
    Object.assign({ list: r.data.items, page: r.data.page, totalPages: r.data.totalPages, totalItems: r.data.totalItems })
  } finally { loading.value = false }
}

onMounted(() => load())
</script>
