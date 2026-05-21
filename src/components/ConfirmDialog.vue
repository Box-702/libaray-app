<template>
  <div class="modal-overlay" v-if="confirm.visible">
    <div class="modal-box">
      <h3>{{ confirm.title }}</h3>
      <p>{{ confirm.message }}</p>
      <div class="modal-actions">
        <button class="btn" @click="confirm.answer(false)">取消</button>
        <button class="btn btn-danger" @click="confirm.answer(true)">确认</button>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useConfirmStore } from '../stores/confirm'
const confirm = useConfirmStore()
</script>
