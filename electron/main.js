const { app, BrowserWindow } = require('electron')
const path = require('path')
const fs = require('fs')

let mainWindow

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
  return new Promise((resolve, reject) => {
    try {
      const { init } = require('../server/db')
      const routes = require('../server/routes')
      const express = require('express')

      init()

      const srv = express()
      srv.use(express.json())
      srv.use('/api', routes)

      if (!isDev) {
        const distPath = path.join(__dirname, '..', 'dist')
        srv.use(express.static(distPath))
        srv.get('*', (req, res) => {
          if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'))
          }
        })
      }

      const port = 3001
      srv.listen(port, '127.0.0.1', () => {
        console.log('Server running on http://127.0.0.1:' + port)
        resolve()
      })

      srv.on('error', reject)
    } catch (e) {
      reject(e)
    }
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
    const distFile = path.join(__dirname, '..', 'dist', 'index.html')
    mainWindow.loadFile(distFile)
  }

  mainWindow.on('closed', () => { mainWindow = null })
}

app.whenReady().then(async () => {
  try {
    await startServer()
    createWindow()
  } catch (err) {
    console.error('Failed to start:', err)
    app.quit()
  }

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
