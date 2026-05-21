const { app, BrowserWindow } = require('electron')
const { fork } = require('child_process')
const path = require('path')
const fs = require('fs')

let mainWindow
let serverProcess

const isDev = !app.isPackaged

const userDataPath = app.getPath('userData')
const dbDir = path.join(userDataPath, 'data')
const dbPath = path.join(dbDir, 'library.db')

if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

process.env.DB_PATH = dbPath
process.env.SERVER_PORT = '3001'

function startServer() {
  return new Promise((resolve) => {
    if (isDev) {
      serverProcess = fork(path.join(__dirname, '..', 'server', 'index.js'), [], {
        env: { ...process.env, DB_PATH: dbPath, SERVER_PORT: '3001' },
        silent: false
      })
    } else {
      const serverPath = path.join(process.resourcesPath, 'server', 'index.js')
      serverProcess = fork(serverPath, [], {
        env: { ...process.env, DB_PATH: dbPath, SERVER_PORT: '3001' },
        silent: false,
        execPath: process.execPath
      })
    }
    serverProcess.stdout.on('data', (d) => console.log('[server]', d.toString().trim()))
    serverProcess.stderr.on('data', (d) => console.error('[server]', d.toString().trim()))
    serverProcess.on('error', (err) => console.error('[server] spawn error:', err))
    setTimeout(resolve, isDev ? 500 : 1500)
  })
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: '图书借阅系统',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  await startServer()
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (serverProcess) serverProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('before-quit', () => {
  if (serverProcess) serverProcess.kill()
})
