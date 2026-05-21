const express = require('express')
const path = require('path')
const { init } = require('./db')
const routes = require('./routes')

init()

const app = express()
const PORT = process.env.SERVER_PORT || 3001

app.use(express.json())

// API routes
app.use('/api', routes)

// Serve static files in production
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(distPath, 'index.html'))
  }
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`DB path: ${process.env.DB_PATH}`)
})
