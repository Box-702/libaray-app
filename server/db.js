const Database = require('better-sqlite3')
const path = require('path')

const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'library.db')
const fs = require('fs')

const dataDir = path.dirname(DB_PATH)
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true })
}

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')
db.pragma('busy_timeout = 5000')

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS book (
      book_id       INTEGER PRIMARY KEY,
      title         TEXT NOT NULL,
      author        TEXT,
      publisher     TEXT,
      publish_date  TEXT,
      price         REAL,
      category_no   TEXT,
      total_count   INTEGER,
      available_count INTEGER,
      keyword       TEXT,
      brief         TEXT,
      location      TEXT
    );

    CREATE TABLE IF NOT EXISTS reader (
      reader_id     INTEGER PRIMARY KEY,
      name          TEXT NOT NULL,
      id_card       TEXT NOT NULL UNIQUE,
      sex           TEXT CHECK (sex IN ('M','F')),
      birth_date    TEXT,
      card_no       TEXT NOT NULL UNIQUE,
      unit          TEXT,
      address       TEXT,
      password      TEXT DEFAULT '123456',
      phone         TEXT,
      reg_date      TEXT,
      max_borrow    INTEGER DEFAULT 5,
      borrowed_count INTEGER DEFAULT 0,
      photo         TEXT,
      occupation    TEXT,
      status        TEXT DEFAULT '1' CHECK (status IN ('0','1','2')),
      remark        TEXT
    );

    CREATE TABLE IF NOT EXISTS borrow (
      borrow_id   INTEGER PRIMARY KEY,
      card_no     TEXT NOT NULL,
      book_id     INTEGER NOT NULL,
      borrow_date TEXT,
      due_date    TEXT NOT NULL,
      return_date TEXT,
      status      TEXT CHECK (status IN ('0','1'))
    );

    CREATE TABLE IF NOT EXISTS operation_log (
      id        INTEGER PRIMARY KEY AUTOINCREMENT,
      time      TEXT NOT NULL,
      action    TEXT NOT NULL,
      detail    TEXT
    );
  `)
}

function seedData() {
  const count = db.prepare('SELECT COUNT(*) as c FROM book').get()
  if (count.c > 0) return

  const today = new Date().toISOString().split('T')[0]

  const insertBook = db.prepare(`INSERT INTO book VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`)
  const books = [
    [20017, '数据库系统概论(第5版)', '王珊', '高等教育出版社', '2014-09-01', 39.80, 'TP311.13', 5, 5, '数据库;教材', '数据库系统经典教材', 'A区-1排-01'],
    [20018, 'Oracle 11g从入门到精通', '李华', '清华大学出版社', '2012-03-01', 69.00, 'TP311.138', 3, 3, 'Oracle;11g', 'Oracle数据库入门书籍', 'A区-1排-02'],
    [20019, 'Java编程思想(第4版)', 'Bruce Eckel', '机械工业出版社', '2007-06-01', 108.00, 'TP312', 3, 3, 'Java;编程', 'Java经典教材', 'B区-2排-01'],
    [20020, '数据结构(C语言版)', '严蔚敏', '清华大学出版社', '2007-01-01', 35.00, 'TP311.12', 4, 4, '数据结构;C语言', '数据结构经典教材', 'B区-2排-02'],
    [20021, '计算机组成原理(第2版)', '唐朔飞', '高等教育出版社', '2008-01-01', 43.00, 'TP303', 3, 3, '计算机组成;硬件', '计算机组成原理入门', 'C区-1排-01'],
    [20022, '计算机网络(第7版)', '谢希仁', '电子工业出版社', '2017-01-01', 49.00, 'TP393', 3, 3, '计算机网络;TCP/IP', '计算机网络经典教材', 'C区-1排-02'],
    [20023, '操作系统概念(第9版)', 'Abraham Silberschatz', '机械工业出版社', '2018-07-01', 78.00, 'TP316', 2, 2, '操作系统;OS', '操作系统经典教材', 'C区-2排-01'],
    [20024, '编译原理(第2版)', 'Alfred V. Aho', '机械工业出版社', '2009-01-01', 89.00, 'TP314', 1, 1, '编译原理;龙书', '编译原理经典教材', 'C区-2排-02'],
    [20025, '算法导论(第3版)', 'Thomas H. Cormen', '机械工业出版社', '2013-01-01', 128.00, 'TP301.6', 2, 2, '算法;CLRS', '算法领域经典之作', 'D区-1排-01'],
    [20026, '深入理解计算机系统(第3版)', 'Randal E. Bryant', '机械工业出版社', '2016-11-01', 139.00, 'TP30', 2, 2, '计算机系统;CSAPP', '计算机系统经典教材', 'D区-1排-02'],
    [20027, 'Python编程：从入门到实践', 'Eric Matthes', '人民邮电出版社', '2016-07-01', 89.00, 'TP311.561', 2, 2, 'Python;入门', 'Python入门实践书籍', 'D区-2排-01'],
    [20028, '机器学习', '周志华', '清华大学出版社', '2016-01-01', 79.00, 'TP181', 1, 1, '机器学习;西瓜书', '机器学习经典教材', 'D区-2排-02'],
    [20029, '深度学习', 'Ian Goodfellow', '人民邮电出版社', '2017-08-01', 168.00, 'TP181', 1, 1, '深度学习;花书', '深度学习领域经典', 'E区-1排-01'],
    [20030, 'C程序设计语言(第2版)', 'Brian W. Kernighan', '机械工业出版社', '2004-01-01', 30.00, 'TP312C', 3, 3, 'C语言;K&R', 'C语言经典教材', 'E区-1排-02'],
    [20031, '软件工程：实践者的研究方法', 'Roger S. Pressman', '机械工业出版社', '2015-01-01', 79.00, 'TP311.5', 2, 2, '软件工程;SE', '软件工程经典教材', 'E区-2排-01']
  ]
  for (const b of books) insertBook.run(...b)

  const insertReader = db.prepare(`INSERT INTO reader (reader_id,name,id_card,sex,card_no,unit,phone,reg_date,max_borrow,borrowed_count,status) VALUES (?,?,?,?,?,?,?,?,?,?,?)`)
  const readers = [
    [10018, '张三', '440101199001011234', 'M', 'R001', '计算机学院', '13800000001', '2025-05-13', 5, 0, '1'],
    [10019, '李丽', '440102199205052345', 'F', 'R002', '软件学院', '13800000002', '2025-07-17', 5, 0, '1'],
    [10020, '王五', '440103199308083456', 'M', 'R003', '电子学院', '13800000003', '2025-10-25', 5, 0, '1'],
    [10021, '赵六', '440104199410104567', 'F', 'R004', '计算机学院', '13800000004', '2025-12-14', 5, 1, '1'],
    [10022, '孙七', '440105199512126789', 'M', 'R005', '数学学院', '13800000005', '2026-01-03', 5, 0, '1'],
    [10023, '周八', '440106199606067890', 'F', 'R006', '物理学院', '13800000006', '2026-01-18', 5, 0, '1'],
    [10024, '吴九', '440107199701018901', 'M', 'R007', '统计学院', '13800000007', '2026-02-11', 5, 0, '1'],
    [10025, '郑十', '440108199803039012', 'F', 'R008', '信息学院', '13800000008', '2026-02-28', 5, 0, '1'],
    [10026, '冯十一', '440109199906069123', 'M', 'R009', '经济学院', '13800000009', '2026-03-07', 5, 0, '1'],
    [10027, '陈十二', '440110200008089234', 'F', 'R010', '管理学院', '13800000010', '2026-03-22', 3, 0, '2']
  ]
  for (const r of readers) insertReader.run(...r)

  const insertBorrow = db.prepare(`INSERT INTO borrow VALUES (?,?,?,?,?,?,?)`)
  const borrows = [
    [17, 'R001', 20017, '2026-04-23', '2026-05-23', '2026-05-01', '1'],
    [18, 'R001', 20018, '2026-05-08', '2026-06-07', null, '0'],
    [19, 'R003', 20019, '2026-04-15', '2026-05-15', '2026-05-10', '1'],
    [20, 'R003', 20020, '2026-04-20', '2026-05-20', null, '0'],
    [21, 'R004', 20020, '2026-04-08', '2026-05-08', null, '0'],
    [22, 'R005', 20021, '2026-05-01', '2026-05-31', '2026-05-12', '1'],
    [23, 'R006', 20025, '2026-05-12', '2026-06-11', null, '0']
  ]
  for (const br of borrows) insertBorrow.run(...br)

  db.prepare(`INSERT INTO operation_log (time, action, detail) VALUES (?, '系统初始化', '数据库初始化完成，示例数据已加载')`).run(today)
}

function init() {
  initSchema()
  seedData()
}

module.exports = { db, init }
