# 图书借阅系统

基于 Electron + Vue 3 + Express + SQLite 的桌面端图书借阅管理系统。

## 功能模块

- **首页概览** - 馆藏统计、借阅中数量、逾期提醒、最近操作日志
- **读者管理** - 读者信息 CRUD、搜索、CSV 导入/导出
- **图书管理** - 图书信息 CRUD、搜索、CSV 导入/导出
- **借书** - 输入借书证号和书号，自动校验读者状态、借阅上限、在馆数量
- **还书** - 输入借书证号和书号，自动计算逾期天数和罚金
- **借阅记录** - 按借书证号筛选，查看所有借阅历史
- **逾期催还** - 列出所有逾期未还记录及逾期天数
- **操作日志** - 记录所有增删改操作，可追溯
- **深色模式** - 一键切换浅色/深色主题

## 技术栈

| 层级 | 技术 |
|------|------|
| 桌面壳 | Electron 30 |
| 前端 | Vue 3 + Pinia + Vue Router + Axios |
| 后端 | Express 4 |
| 数据库 | SQLite (better-sqlite3) |
| 构建 | Vite 5 + electron-builder |

## 项目结构

```
library-app-v2/
├── electron/
│   ├── main.js            # Electron 主进程
│   └── preload.js         # 预加载脚本
├── server/
│   ├── db.js              # 数据库初始化、建表、种子数据
│   ├── routes.js          # REST API 路由
│   └── index.js           # Express 服务入口
├── src/
│   ├── api/index.js       # Axios 实例
│   ├── router/index.js    # Vue Router 配置
│   ├── stores/            # Pinia 状态管理
│   │   ├── readers.js
│   │   ├── books.js
│   │   ├── borrows.js
│   │   ├── overdue.js
│   │   ├── dashboard.js
│   │   ├── toast.js
│   │   └── confirm.js
│   ├── views/             # 页面组件
│   │   ├── Dashboard.vue
│   │   ├── Readers.vue
│   │   ├── Books.vue
│   │   ├── Borrow.vue
│   │   ├── ReturnBook.vue
│   │   ├── BorrowList.vue
│   │   ├── Overdue.vue
│   │   └── Logs.vue
│   ├── components/        # 通用组件
│   │   ├── Pagination.vue
│   │   ├── Toast.vue
│   │   └── ConfirmDialog.vue
│   ├── App.vue            # 根组件
│   ├── main.js            # Vue 入口
│   └── styles.css         # 全局样式及深色主题
├── index.html
├── vite.config.js
├── package.json
└── .gitignore
```

## 开发

### 环境要求

- Node.js >= 18
- npm >= 9

### 安装依赖

```bash
npm install
```

### 启动开发环境

```bash
npm run dev
```

启动后 Vite 开发服务器运行在 `http://localhost:3000`，Express API 服务运行在 `http://localhost:3001`。Vite 自动将 `/api` 请求代理到 Express。

### 构建前端

```bash
npm run build
```

## 打包

```bash
npm run dist
```

执行后将在 `release/` 目录生成 Windows 安装包（NSIS 格式，`.exe`）。

打包配置见 `package.json` 中的 `build` 字段，可按需调整目标平台。

## 数据库

应用使用 SQLite 嵌入式数据库，无需额外安装。首次启动时自动建表并写入示例数据。

- 开发环境：数据库文件位于 `server/data/library.db`
- 生产环境（打包后）：数据库文件位于 `%APPDATA%/library-app/data/library.db`

示例数据包含 15 本图书、10 名读者和 7 条借阅记录。

## API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/dashboard` | 获取仪表盘统计数据 |
| GET | `/api/readers?q=&page=&size=` | 查询读者（支持搜索） |
| POST | `/api/readers` | 新增读者 |
| PUT | `/api/readers/:id` | 更新读者 |
| DELETE | `/api/readers/:id` | 删除读者 |
| GET | `/api/books?q=&page=&size=` | 查询图书（支持搜索） |
| POST | `/api/books` | 新增图书 |
| PUT | `/api/books/:id` | 更新图书 |
| DELETE | `/api/books/:id` | 删除图书 |
| POST | `/api/borrow` | 借书 |
| POST | `/api/return` | 还书 |
| GET | `/api/borrows?cardNo=&page=&size=` | 查询借阅记录 |
| GET | `/api/overdue?page=&size=` | 查询逾期记录 |
| GET | `/api/logs?page=&size=` | 查询操作日志 |
| GET | `/api/export/:type` | 导出 CSV（readers/books/borrows） |
| POST | `/api/import/csv` | 导入 CSV |

### 借书/还书逻辑

借书校验流程：
1. 检查读者是否存在、是否注销/挂失
2. 检查是否超过借阅上限
3. 检查图书在馆数量
4. 写入借阅记录，更新在馆数量和读者已借数

还书流程：
1. 查找未还借阅记录
2. 计算逾期天数，逾期罚金 = 逾期天数 * 0.1 元
3. 更新借阅记录状态、恢复在馆数量、减少读者已借数
