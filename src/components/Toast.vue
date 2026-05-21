<template>
  <div class="toast-container">
    <div v-for="m in toast.messages" :key="m.id" :class="['toast-item', 'toast-' + m.type]">{{ m.text }}</div>
  </div>
</template>
<script setup>
import { useToastStore } from '../stores/toast'
const toast = useToastStore()
</script>
