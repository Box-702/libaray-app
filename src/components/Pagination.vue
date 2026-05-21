<template>
  <div class="pagination" v-if="totalPages > 1">
    <button class="btn" :disabled="page <= 0" @click="$emit('go', page - 1)">上一页</button>
    <span class="page-info">{{ page + 1 }} / {{ totalPages }} (共 {{ totalItems }} 条)</span>
    <button class="btn" :disabled="page >= totalPages - 1" @click="$emit('go', page + 1)">下一页</button>
  </div>
</template>
<script setup>
defineProps({ page: Number, totalPages: Number, totalItems: Number })
defineEmits(['go'])
</script>
<style scoped>
.pagination { display: flex; align-items: center; gap: 12px; margin-top: 16px; justify-content: center; }
.page-info { font-size: 13px; color: var(--text-secondary); }
</style>
