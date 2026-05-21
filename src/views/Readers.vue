<template>
  <div>
    <div class="toolbar">
      <div class="search-bar"><input v-model="kw" placeholder="搜索读者姓名..." @input="onSearch"/></div>
      <button class="btn btn-primary" @click="openEdit(null)">新增读者</button>
      <button class="btn" @click="handleImport" ref="importBtn">导入CSV</button>
      <input type="file" accept=".csv" style="display:none" ref="fileInput" @change="onFileChange"/>
      <button class="btn" @click="doExport">导出CSV</button>
    </div>
    <div v-if="store.loading" class="loading">加载中...</div>
    <div v-if="store.error" class="error-msg">{{ store.error }}</div>
    <div class="card" v-if="!store.loading && !store.error">
      <table><thead><tr><th>借书证号</th><th>姓名</th><th>性别</th><th>身份证号</th><th>单位</th><th>电话</th><th>已借/上限</th><th>状态</th><th>操作</th></tr></thead>
        <tbody><tr v-for="r in store.list" :key="r.readerId || r.reader_id">
          <td><code>{{ r.cardNo || r.card_no }}</code></td><td>{{ r.name }}</td><td>{{ sexMap[r.sex] || r.sex }}</td><td>{{ r.idCard || r.id_card }}</td><td>{{ r.unit }}</td><td>{{ r.phone }}</td>
          <td>{{ r.borrowedCount ?? r.borrowed_count }}/{{ r.maxBorrow ?? r.max_borrow }}</td>
          <td><span :class="['tag', getStatusCls(r.status)]">{{ statusMap[r.status] }}</span></td>
          <td>
            <button class="btn" @click="openEdit(r)">编辑</button>
            <button class="btn btn-danger" @click="doDelete(r)">删除</button>
          </td>
        </tr></tbody>
      </table>
      <Pagination :page="store.page" :totalPages="store.totalPages" :totalItems="store.totalItems" @go="store.load"/>
    </div>

    <div v-if="showForm" class="card">
      <h3 style="margin-bottom:16px">{{ editing ? '编辑读者' : '新增读者' }}</h3>
      <div class="form-group"><label>借书证号</label><input v-model="form.cardNo"/></div>
      <div class="form-group"><label>姓名</label><input v-model="form.name"/></div>
      <div class="form-group"><label>性别</label><select v-model="form.sex"><option value="">--</option><option value="M">男</option><option value="F">女</option></select></div>
      <div class="form-group"><label>身份证号</label><input v-model="form.idCard"/></div>
      <div class="form-group"><label>单位</label><input v-model="form.unit"/></div>
      <div class="form-group"><label>电话</label><input v-model="form.phone"/></div>
      <div class="form-group"><label>最大借阅</label><input v-model.number="form.maxBorrow" type="number"/></div>
      <div class="form-group"><label>状态</label><select v-model="form.status"><option value="1">正常</option><option value="2">挂失</option><option value="0">注销</option></select></div>
      <button class="btn btn-primary" @click="doSave" style="margin-left:88px">保存</button>
      <button class="btn" @click="showForm=false" style="margin-left:8px">取消</button>
    </div>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue'
import { useReadersStore } from '../stores/readers'
import { useToastStore } from '../stores/toast'
import { useConfirmStore } from '../stores/confirm'
import Pagination from '../components/Pagination.vue'
import api from '../api'

const store = useReadersStore()
const toast = useToastStore()
const confirm = useConfirmStore()

const kw = ref('')
const showForm = ref(false), editing = ref(null)
const form = ref({ cardNo: '', name: '', sex: '', idCard: '', unit: '', phone: '', maxBorrow: 5, status: '1' })
const statusMap = { '0': '注销', '1': '正常', '2': '挂失' }
const sexMap = { 'M': '男', 'F': '女' }

const getStatusCls = (s) => s === '1' ? 'tag-green' : s === '2' ? 'tag-red' : 'tag-gray'

const onSearch = () => store.search(kw.value)

const openEdit = (r) => {
  editing.value = r
  if (r) {
    form.value = {
      cardNo: r.cardNo || r.card_no, name: r.name, sex: r.sex,
      idCard: r.idCard || r.id_card, unit: r.unit || '', phone: r.phone || '',
      maxBorrow: r.maxBorrow ?? r.max_borrow ?? 5, status: r.status
    }
  } else {
    form.value = { cardNo: '', name: '', sex: '', idCard: '', unit: '', phone: '', maxBorrow: 5, status: '1' }
  }
  showForm.value = true
}

const doSave = async () => {
  try {
    const editingId = editing.value ? (editing.value.readerId || editing.value.reader_id) : null
    await store.save(form.value, editingId)
    showForm.value = false
    await store.load(store.page)
    toast.success(editingId ? '读者更新成功' : '读者添加成功')
  } catch (e) {
    toast.error(e.response?.data?.msg || '保存失败')
  }
}

const doDelete = async (r) => {
  const ok = await confirm.show(`确认删除读者「${r.name}」(${r.cardNo || r.card_no})？`)
  if (!ok) return
  try {
    await store.remove(r.readerId || r.reader_id)
    await store.load(store.page)
    toast.success('读者已删除')
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
  const nameIdx = headers.findIndex(h => h.includes('姓名'))
  const cardIdx = headers.findIndex(h => h.includes('借书证号') || h.includes('card'))
  const data = lines.slice(1).map(line => {
    const cols = line.split(',').map(c => c.trim().replace(/^"(.*)"$/, '$1'))
    return { name: cols[nameIdx], cardNo: cols[cardIdx] }
  })
  try {
    const r = await api.post('/import/csv', { type: 'readers', data })
    if (r.data.ok) { toast.success(r.data.msg); store.load(0) }
    else toast.error(r.data.msg)
  } catch (e) { toast.error('导入失败') }
  fileInput.value.value = ''
}

const doExport = async () => {
  const r = await api.get('/export/readers', { responseType: 'blob' })
  const url = URL.createObjectURL(new Blob([r.data], { type: 'text/csv' }))
  const a = document.createElement('a')
  a.href = url; a.download = 'readers.csv'; a.click()
  URL.revokeObjectURL(url)
  toast.success('导出成功')
}

onMounted(() => store.load())
</script>
