<template>
  <div>
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-if="store.error" class="error-msg">{{ store.error }}</div>
    <div v-if="!store.loading && !store.error">
      <div class="dashboard-grid">
        <div class="dashboard-card">
          <div class="num">{{ stats.borrowedBooks }}</div>
          <div class="label">已借出图书</div>
        </div>
        <div class="dashboard-card">
          <div class="num">{{ stats.availableBooks }}</div>
          <div class="label">在馆图书</div>
        </div>
        <div class="dashboard-card">
          <div class="num">{{ stats.totalBooks }}</div>
          <div class="label">总馆藏数</div>
        </div>
        <div class="dashboard-card">
          <div class="num">{{ stats.totalReaders }}</div>
          <div class="label">活跃读者</div>
        </div>
        <div class="dashboard-card">
          <div class="num">{{ stats.activeBorrows }}</div>
          <div class="label">当前借阅中</div>
        </div>
        <div class="dashboard-card">
          <div class="num" style="color: #cf222e" v-if="stats.overdueCount > 0">{{ stats.overdueCount }}</div>
          <div class="num" v-else>{{ stats.overdueCount }}</div>
          <div class="label">逾期未还</div>
        </div>
      </div>
      <div class="card">
        <h3 style="margin-bottom:12px">最近操作</h3>
        <table>
          <thead><tr><th>时间</th><th>操作</th><th>详情</th></tr></thead>
          <tbody>
            <tr v-for="l in stats.recentLogs" :key="l.id">
              <td>{{ l.time }}</td><td>{{ l.action }}</td><td>{{ l.detail }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>
<script setup>
import { onMounted, computed } from 'vue'
import { useDashboardStore } from '../stores/dashboard'
const store = useDashboardStore()
const stats = computed(() => store.stats)
onMounted(() => store.load())
</script>
