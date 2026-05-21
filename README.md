# 图书借阅系统

基于 Electron + Vue 3 + Express + SQLite 的桌面端图书借阅管理系统。

## 用户使用

### 方式一：下载安装包（推荐）

1. 前往 [Releases](https://github.com/Box-702/libaray-app/releases) 页面
2. 下载最新版本的 `图书借阅系统-Setup-x.x.x.exe`
3. 双击安装，选择安装目录，完成安装
4. 桌面双击"图书借阅系统"图标启动

应用无需安装数据库或其他依赖，开箱即用。数据自动保存在本地 `%APPDATA%/library-app/data/` 目录。

### 方式二：源码运行

环境要求：Node.js >= 18，npm >= 9

```bash
git clone https://github.com/Box-702/libaray-app.git
cd libaray-app
npm install
npm run dev
```

浏览器打开 `http://localhost:3000` 即可使用。

## 功能模块

- **首页概览** -- 馆藏统计、借阅中数量、逾期提醒、最近操作日志
- **读者管理** -- 读者信息 CRUD、搜索、CSV 导入/导出
- **图书管理** -- 图书信息 CRUD、搜索、CSV 导入/导出
- **借书** -- 输入借书证号和书号，自动校验读者状态、借阅上限、在馆数量
- **还书** -- 输入借书证号和书号，自动计算逾期天数和罚金（0.1元/天）
- **借阅记录** -- 按借书证号筛选，查看所有借阅历史
- **逾期催还** -- 列出所有逾期未还记录及逾期天数
- **操作日志** -- 记录所有增删改操作，可追溯
- **深色模式** -- 一键切换浅色/深色主题

## 构建安装包

### 环境准备

- Windows 10/11
- Node.js >= 18
- 建议使用 LTS 版本

### 构建步骤

```bash
# 1. 克隆仓库
git clone https://github.com/Box-702/libaray-app.git
cd libaray-app

# 2. 安装依赖（better-sqlite3 需要原生编译，确保已安装 Visual Studio Build Tools 或 windows-build-tools）
npm install

# 3. 构建前端
npm run build

# 4. 打包为 Windows 安装包
npm run dist
```

打包产物位于 `release/` 目录：

| 文件 | 说明 |
|------|------|
| `图书借阅系统 Setup x.x.x.exe` | NSIS 安装程序，分发给用户 |
| `win-unpacked/` | 免安装绿色版目录 |

### 打包故障排查

如果 `npm install` 报 `better-sqlite3` 编译错误：

1. 安装 [Visual Studio Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022)，勾选"Desktop development with C++"
2. 或以管理员身份运行 `npm install --global windows-build-tools`
3. 重新执行 `npm install`

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
│   ├── main.js            # Electron 主进程，启动 Express 子进程
│   └── preload.js         # 预加载脚本
├── server/
│   ├── db.js              # 数据库初始化、建表、种子数据
│   ├── routes.js          # REST API 路由（14 个端点）
│   └── index.js           # Express 服务入口
├── src/
│   ├── api/index.js       # Axios 实例
│   ├── router/index.js    # Vue Router 配置（hash 模式，8 路由）
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
│   └── styles.css         # 全局样式及深色主题 CSS 变量
├── index.html
├── vite.config.js
├── package.json
└── .gitignore
```

## 数据库

应用使用 SQLite 嵌入式数据库，无需安装。首次启动时自动建表并写入示例数据（15 本图书、10 名读者、7 条借阅记录）。

| 环境 | 数据库路径 |
|------|-----------|
| 开发 (`npm run dev`) | `server/data/library.db` |
| 打包后（安装版） | `%APPDATA%/library-app/data/library.db` |

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

借书校验：
1. 检查读者是否存在、是否注销/挂失
2. 检查是否超过借阅上限
3. 检查图书在馆数量
4. 写入借阅记录，扣减在馆数，增加读者已借数

还书：
1. 查找未还借阅记录
2. 计算逾期天数，罚金 = 天数 * 0.1 元
3. 更新记录状态，恢复在馆数，减少读者已借数
