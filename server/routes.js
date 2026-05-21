const express = require('express')
const { db } = require('./db')

const router = express.Router()

function pageResult(all, page, size) {
  const total = all.length
  const totalPages = total === 0 ? 0 : Math.ceil(total / size)
  const from = page * size
  const to = Math.min(from + size, total)
  const items = from < total ? all.slice(from, to) : []
  return { items, page, totalPages, totalItems: total, size }
}

function log(action, detail) {
  const time = new Date().toISOString().replace('T', ' ').substring(0, 19)
  db.prepare('INSERT INTO operation_log (time, action, detail) VALUES (?,?,?)').run(time, action, detail || '')
}

// ---- Dashboard ----
router.get('/dashboard', (req, res) => {
  const totalBooks = db.prepare('SELECT COALESCE(SUM(total_count),0) as c FROM book').get().c
  const availableBooks = db.prepare('SELECT COALESCE(SUM(available_count),0) as c FROM book').get().c
  const borrowedBooks = totalBooks - availableBooks
  const totalReaders = db.prepare('SELECT COUNT(*) as c FROM reader WHERE status != ?').get('0').c
  const activeBorrows = db.prepare("SELECT COUNT(*) as c FROM borrow WHERE status = '0'").get().c
  const overdueCount = db.prepare("SELECT COUNT(*) as c FROM borrow WHERE status = '0' AND due_date < date('now')").get().c
  const recentLogs = db.prepare('SELECT * FROM operation_log ORDER BY id DESC LIMIT 10').all()
  res.json({ totalBooks, availableBooks, borrowedBooks, totalReaders, activeBorrows, overdueCount, recentLogs })
})

// ---- Readers ----
router.get('/readers', (req, res) => {
  const { q, page = 0, size = 15 } = req.query
  let rows
  if (q) {
    rows = db.prepare('SELECT * FROM reader WHERE name LIKE ? ORDER BY reader_id').all('%' + q + '%')
  } else {
    rows = db.prepare('SELECT * FROM reader ORDER BY reader_id').all()
  }
  res.json(pageResult(rows, +page, +size))
})

router.get('/readers/all', (req, res) => {
  const rows = db.prepare('SELECT reader_id, name, card_no, unit FROM reader WHERE status = ?').all('1')
  res.json(rows)
})

router.post('/readers', (req, res) => {
  const r = req.body
  const maxId = db.prepare('SELECT MAX(reader_id) as m FROM reader').get().m || 10018
  const id = maxId + 1
  const regDate = new Date().toISOString().split('T')[0]
  db.prepare(`INSERT INTO reader (reader_id,name,id_card,sex,card_no,unit,phone,reg_date,max_borrow,borrowed_count,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(id, r.name, r.idCard, r.sex, r.cardNo, r.unit, r.phone, regDate, r.maxBorrow || 5, 0, r.status || '1')
  log('新增读者', `${r.name} (${r.cardNo})`)
  res.json(db.prepare('SELECT * FROM reader WHERE reader_id = ?').get(id))
})

router.put('/readers/:id', (req, res) => {
  const r = req.body
  db.prepare(`UPDATE reader SET name=?,id_card=?,sex=?,card_no=?,unit=?,phone=?,max_borrow=?,status=? WHERE reader_id=?`)
    .run(r.name, r.idCard, r.sex, r.cardNo, r.unit, r.phone, r.maxBorrow, r.status, +req.params.id)
  log('编辑读者', `${r.name} (${r.cardNo})`)
  res.json(db.prepare('SELECT * FROM reader WHERE reader_id = ?').get(+req.params.id))
})

router.delete('/readers/:id', (req, res) => {
  const reader = db.prepare('SELECT * FROM reader WHERE reader_id = ?').get(+req.params.id)
  if (reader) {
    db.prepare('DELETE FROM reader WHERE reader_id = ?').run(+req.params.id)
    log('删除读者', `${reader.name} (${reader.cardNo})`)
  }
  res.json({ ok: true })
})

// ---- Books ----
router.get('/books', (req, res) => {
  const { q, page = 0, size = 15 } = req.query
  let rows
  if (q) {
    const kw = '%' + q + '%'
    rows = db.prepare('SELECT * FROM book WHERE title LIKE ? OR author LIKE ? OR publisher LIKE ? ORDER BY book_id').all(kw, kw, kw)
  } else {
    rows = db.prepare('SELECT * FROM book ORDER BY book_id').all()
  }
  res.json(pageResult(rows, +page, +size))
})

router.get('/books/all', (req, res) => {
  const rows = db.prepare('SELECT book_id, title, author FROM book WHERE available_count > 0').all()
  res.json(rows)
})

router.post('/books', (req, res) => {
  const b = req.body
  const maxId = db.prepare('SELECT MAX(book_id) as m FROM book').get().m || 20017
  const id = maxId + 1
  db.prepare(`INSERT INTO book VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, b.title, b.author, b.publisher, b.publishDate, b.price, b.categoryNo,
    b.totalCount, b.availableCount, b.keyword, b.brief, b.location)
  log('新增图书', `${b.title} (${id})`)
  res.json(db.prepare('SELECT * FROM book WHERE book_id = ?').get(id))
})

router.put('/books/:id', (req, res) => {
  const b = req.body
  db.prepare(`UPDATE book SET title=?,author=?,publisher=?,publish_date=?,price=?,category_no=?,total_count=?,available_count=?,keyword=?,brief=?,location=? WHERE book_id=?`)
    .run(b.title, b.author, b.publisher, b.publishDate, b.price, b.categoryNo,
      b.totalCount, b.availableCount, b.keyword, b.brief, b.location, +req.params.id)
  log('编辑图书', `${b.title} (${+req.params.id})`)
  res.json(db.prepare('SELECT * FROM book WHERE book_id = ?').get(+req.params.id))
})

router.delete('/books/:id', (req, res) => {
  const book = db.prepare('SELECT * FROM book WHERE book_id = ?').get(+req.params.id)
  if (book) {
    db.prepare('DELETE FROM book WHERE book_id = ?').run(+req.params.id)
    log('删除图书', `${book.title} (${+req.params.id})`)
  }
  res.json({ ok: true })
})

// ---- Borrow ----
router.post('/borrow', (req, res) => {
  const { cardNo, bookId } = req.body

  const reader = db.prepare('SELECT * FROM reader WHERE card_no = ?').get(cardNo)
  if (!reader) return res.json({ ok: false, msg: 'FAIL:借书证号不存在' })
  if (reader.status === '0') return res.json({ ok: false, msg: 'FAIL:该借书证已注销' })
  if (reader.status === '2') return res.json({ ok: false, msg: 'FAIL:该借书证已挂失，无法借阅' })
  if (reader.borrowed_count >= reader.max_borrow) return res.json({ ok: false, msg: `FAIL:已达借书上限(${reader.max_borrow}本)，请先归还` })

  const book = db.prepare('SELECT * FROM book WHERE book_id = ?').get(bookId)
  if (!book) return res.json({ ok: false, msg: 'FAIL:书号不存在' })
  if (book.available_count <= 0) return res.json({ ok: false, msg: 'FAIL:该书已全部借出' })

  const maxId = db.prepare('SELECT MAX(borrow_id) as m FROM borrow').get().m || 17
  const borrowId = maxId + 1
  const today = new Date().toISOString().split('T')[0]
  const due = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const insertBorrow = db.transaction(() => {
    db.prepare('INSERT INTO borrow VALUES (?,?,?,?,?,?,?)').run(borrowId, cardNo, bookId, today, due, null, '0')
    db.prepare('UPDATE book SET available_count = available_count - 1 WHERE book_id = ?').run(bookId)
    db.prepare('UPDATE reader SET borrowed_count = borrowed_count + 1 WHERE card_no = ?').run(cardNo)
  })
  insertBorrow()
  log('借书', `${reader.name} 借阅《${book.title}》`)
  res.json({ ok: true, msg: `SUCCESS:借书成功！应还日期：${due}` })
})

// ---- Return ----
router.post('/return', (req, res) => {
  const { cardNo, bookId } = req.body

  const br = db.prepare("SELECT * FROM borrow WHERE card_no = ? AND book_id = ? AND status = '0' LIMIT 1").get(cardNo, bookId)
  if (!br) return res.json({ ok: false, msg: 'FAIL:未找到该读者借阅的此本未还记录' })

  const today = new Date().toISOString().split('T')[0]
  const due = new Date(br.due_date)
  const now = new Date(today)
  const overdueDays = Math.max(0, Math.floor((now - due) / (1000 * 60 * 60 * 24)))
  const fine = (overdueDays * 0.1).toFixed(2)

  const doReturn = db.transaction(() => {
    db.prepare("UPDATE borrow SET return_date = ?, status = '1' WHERE borrow_id = ?").run(today, br.borrow_id)
    db.prepare('UPDATE book SET available_count = available_count + 1 WHERE book_id = ?').run(bookId)
    db.prepare('UPDATE reader SET borrowed_count = borrowed_count - 1 WHERE card_no = ?').run(cardNo)
  })
  doReturn()

  const reader = db.prepare('SELECT name FROM reader WHERE card_no = ?').get(cardNo)
  const book = db.prepare('SELECT title FROM book WHERE book_id = ?').get(bookId)
  log('还书', `${reader.name} 归还《${book.title}》${overdueDays > 0 ? ' - 逾期' + overdueDays + '天，罚金' + fine + '元' : ''}`)

  if (overdueDays > 0) {
    res.json({ ok: true, msg: `SUCCESS:还书成功！逾期${overdueDays}天，应缴罚金${fine}元` })
  } else {
    res.json({ ok: true, msg: 'SUCCESS:还书成功！' })
  }
})

// ---- Borrows ----
router.get('/borrows', (req, res) => {
  const { cardNo, page = 0, size = 15 } = req.query
  let rows
  if (cardNo) {
    rows = db.prepare(`
      SELECT b.*, r.name as reader_name, bk.title as book_title
      FROM borrow b
      LEFT JOIN reader r ON b.card_no = r.card_no
      LEFT JOIN book bk ON b.book_id = bk.book_id
      WHERE b.card_no = ?
      ORDER BY b.borrow_date DESC`).all(cardNo)
  } else {
    rows = db.prepare(`
      SELECT b.*, r.name as reader_name, bk.title as book_title
      FROM borrow b
      LEFT JOIN reader r ON b.card_no = r.card_no
      LEFT JOIN book bk ON b.book_id = bk.book_id
      ORDER BY b.borrow_date DESC`).all()
  }
  // Transform to match old API format
  const transformed = rows.map(b => ({
    borrowId: b.borrow_id,
    cardNo: b.card_no,
    bookId: b.book_id,
    borrowDate: b.borrow_date,
    dueDate: b.due_date,
    returnDate: b.return_date,
    status: b.status,
    reader: { name: b.reader_name },
    book: { title: b.book_title }
  }))
  res.json(pageResult(transformed, +page, +size))
})

// ---- Overdue ----
router.get('/overdue', (req, res) => {
  const { page = 0, size = 15 } = req.query
  const rows = db.prepare(`
    SELECT b.*, r.name as reader_name, r.phone as reader_phone, bk.title as book_title
    FROM borrow b
    LEFT JOIN reader r ON b.card_no = r.card_no
    LEFT JOIN book bk ON b.book_id = bk.book_id
    WHERE b.status = '0' AND b.due_date < date('now')
    ORDER BY b.due_date ASC`).all()
  const transformed = rows.map(b => ({
    borrowId: b.borrow_id,
    cardNo: b.card_no,
    borrowDate: b.borrow_date,
    dueDate: b.due_date,
    reader: { name: b.reader_name, phone: b.reader_phone },
    book: { title: b.book_title }
  }))
  res.json(pageResult(transformed, +page, +size))
})

// ---- Operation Logs ----
router.get('/logs', (req, res) => {
  const { page = 0, size = 20 } = req.query
  const all = db.prepare('SELECT * FROM operation_log ORDER BY id DESC').all()
  res.json(pageResult(all, +page, +size))
})

// ---- CSV Import ----
router.post('/import/csv', express.json({ limit: '10mb' }), (req, res) => {
  const { type, data } = req.body
  if (!data || !Array.isArray(data) || data.length === 0) {
    return res.json({ ok: false, msg: '没有数据可导入' })
  }
  let count = 0
  try {
    const doImport = db.transaction(() => {
      if (type === 'readers') {
        for (const r of data) {
          if (!r.name || !r.cardNo) continue
          const maxId = db.prepare('SELECT MAX(reader_id) as m FROM reader').get().m || 10018
          const id = maxId + 1
          db.prepare(`INSERT INTO reader (reader_id,name,id_card,sex,card_no,unit,phone,reg_date,max_borrow,borrowed_count,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
            .run(id, r.name, r.idCard || '', r.sex || '', r.cardNo, r.unit || '', r.phone || '', new Date().toISOString().split('T')[0], r.maxBorrow || 5, 0, r.status || '1')
          count++
        }
      } else if (type === 'books') {
        for (const b of data) {
          if (!b.title) continue
          const maxId = db.prepare('SELECT MAX(book_id) as m FROM book').get().m || 20017
          const id = maxId + 1
          db.prepare(`INSERT INTO book VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
            .run(id, b.title, b.author || '', b.publisher || '', b.publishDate, b.price, b.categoryNo || '', b.totalCount || 1, b.totalCount || 1, b.keyword || '', b.brief || '', b.location || '')
          count++
        }
      }
    })
    doImport()
    log('CSV导入', `导入${type === 'readers' ? '读者' : '图书'} ${count} 条`)
    res.json({ ok: true, msg: `成功导入 ${count} 条记录` })
  } catch (e) {
    res.json({ ok: false, msg: '导入失败: ' + e.message })
  }
})

// ---- CSV Export ----
router.get('/export/:type', (req, res) => {
  const { type } = req.params
  let rows, headers
  if (type === 'readers') {
    headers = ['借书证号', '姓名', '性别', '身份证号', '单位', '电话', '已借/上限', '状态']
    rows = db.prepare('SELECT card_no, name, sex, id_card, unit, phone, borrowed_count, max_borrow, status FROM reader').all()
  } else if (type === 'books') {
    headers = ['书号', '书名', '作者', '出版社', '价格', '在馆/馆藏', '分类号', '位置']
    rows = db.prepare('SELECT book_id, title, author, publisher, price, available_count, total_count, category_no, location FROM book').all()
  } else if (type === 'borrows') {
    headers = ['借阅编号', '读者', '借书证号', '书名', '借书日期', '应还日期', '还书日期', '状态']
    rows = db.prepare(`
      SELECT b.borrow_id, r.name, b.card_no, bk.title, b.borrow_date, b.due_date, b.return_date, b.status
      FROM borrow b LEFT JOIN reader r ON b.card_no = r.card_no LEFT JOIN book bk ON b.book_id = bk.book_id
      ORDER BY b.borrow_date DESC`).all()
  } else {
    return res.status(400).json({ ok: false, msg: '未知类型' })
  }

  const csv = [headers.join(','), ...rows.map(r => Object.values(r).map(v => {
    if (v === null || v === undefined) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') ? '"' + s.replace(/"/g, '""') + '"' : s
  }).join(','))].join('\n')

  const bom = '﻿'
  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="${type}-${new Date().toISOString().split('T')[0]}.csv"`)
  res.send(bom + csv)
})

module.exports = router
