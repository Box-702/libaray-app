<template>
  <div>
    <div class="toolbar">
      <div class="search-bar"><input v-model="kw" placeholder="搜索书名/作者/出版社..." @input="onSearch"/></div>
      <button class="btn btn-primary" @click="openEdit(null)">新增图书</button>
      <button class="btn" @click="handleImport" ref="importBtn">导入CSV</button>
      <input type="file" accept=".csv" style="display:none" ref="fileInput" @change="onFileChange"/>
      <button class="btn" @click="doExport">导出CSV</button>
    </div>
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-if="store.error" class="error-msg">{{ store.error }}</div>
    <div class="card" v-if="!store.loading && !store.error">
      <table><thead><tr><th>书号</th><th>书名</th><th>作者</th><th>出版社</th><th>价格</th><th>在馆/馆藏</th><th>位置</th><th>操作</th></tr></thead>
        <tbody><tr v-for="b in store.list" :key="b.bookId || b.book_id">
          <td><code>{{ b.bookId || b.book_id }}</code></td><td>{{ b.title }}</td><td>{{ b.author }}</td><td>{{ b.publisher }}</td>
          <td>¥{{ b.price }}</td><td>{{ b.availableCount ?? b.available_count }}/{{ b.totalCount ?? b.total_count }}</td><td>{{ b.location }}</td>
          <td>
            <button class="btn" @click="openEdit(b)">编辑</button>
            <button class="btn btn-danger" @click="doDelete(b)">删除</button>
          </td>
        </tr></tbody>
      </table>
      <Pagination :page="store.page" :totalPages="store.totalPages" :totalItems="store.totalItems" @go="store.load"/>
    </div>

    <div v-if="showForm" class="card">
      <h3 style="margin-bottom:16px">{{ editing ? '编辑图书' : '新增图书' }}</h3>
      <div class="form-group"><label>书名</label><input v-model="form.title"/></div>
      <div class="form-group"><label>作者</label><input v-model="form.author"/></div>
      <div class="form-group"><label>出版社</label><input v-model="form.publisher"/></div>
      <div class="form-group"><label>价格</label><input v-model.number="form.price" type="number" step="0.01"/></div>
      <div class="form-group"><label>分类号</label><input v-model="form.categoryNo"/></div>
      <div class="form-group"><label>馆藏数</label><input v-model.number="form.totalCount" type="number"/></div>
      <div class="form-group"><label>在馆数</label><input v-model.number="form.availableCount" type="number"/></div>
      <div class="form-group"><label>位置</label><input v-model="form.location"/></div>
      <div class="form-group"><label>关键词</label><input v-model="form.keyword"/></div>
      <div class="form-group"><label>简介</label><input v-model="form.brief"/></div>
      <button class="btn btn-primary" @click="doSave" style="margin-left:88px">保存</button>
      <button class="btn" @click="showForm=false" style="margin-left:8px">取消</button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useBooksStore } from '../stores/books'
import { useToastStore } from '../stores/toast'
import { useConfirmStore } from '../stores/confirm'
import Pagination from '../components/Pagination.vue'
import api from '../api'

const store = useBooksStore()
const toast = useToastStore()
const confirm = useConfirmStore()

const kw = ref('')
const showForm = ref(false), editing = ref(null)
const form = ref({ title: '', author: '', publisher: '', price: null, categoryNo: '', totalCount: null, availableCount: null, location: '', keyword: '', brief: '' })

const onSearch = () => store.search(kw.value)

const openEdit = (b) => {
  editing.value = b
  if (b) {
    form.value = {
      title: b.title, author: b.author || '', publisher: b.publisher || '',
      price: b.price, categoryNo: b.categoryNo || b.category_no || '',
      totalCount: b.totalCount ?? b.total_count, availableCount: b.availableCount ?? b.available_count,
      location: b.location || '', keyword: b.keyword || '', brief: b.brief || ''
    }
  } else {
    form.value = { title: '', author: '', publisher: '', price: null, categoryNo: '', totalCount: null, availableCount: null, location: '', keyword: '', brief: '' }
  }
  showForm.value = true
}

const doSave = async () => {
  try {
    const editingId = editing.value ? (editing.value.bookId || editing.value.book_id) : null
    await store.save(form.value, editingId)
    showForm.value = false
    await store.load(store.page)
    toast.success(editingId ? '图书更新成功' : '图书添加成功')
  } catch (e) { toast.error(e.response?.data?.msg || '保存失败') }
}

const doDelete = async (b) => {
  const ok = await confirm.show(`确认删除图书「${b.title}」？`)
  if (!ok) return
  try {
    await store.remove(b.bookId || b.book_id)
    await store.load(store.page)
    toast.success('图书已删除')
  } catch (e) { toast.error('删除失败') }
}

const fileInput = ref(null)
const handleImport = () => fileInput.value.click()
const onFileChange = async (e) => {
  const file = e.target.files[0]
  if (!file) return
  const text = await file.text()
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) { toast.error('CSV至少需要标题行+一条数据'); return }
  const headers = lines[0].split(',').map(h => h.trim().replace('"', '').replace('"', ''))
  const titleIdx = headers.findIndex(h => h.includes('书名'))
  const data = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'))
    return { title: cols[titleIdx] }
  })
  try {
    const r = await api.post('/import/csv', { type: 'books', data })
    if (r.data.ok) { toast.success(r.data.msg); store.load(0) }
    else toast.error(r.data.msg)
  } catch (e) { toast.error('导入失败') }
  fileInput.value.value = ''
}

const doExport = async () => {
  const r = await api.get('/export/books', { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }))
  const a = document.createElement('a'); a.href = url; a.download = 'books.csv'; a.click()
  URL.revokeObjectURL(url)
  toast.success('导出成功')
}

onMounted(() => store.load())
</script>
