const fs = require('node:fs')
const path = require('node:path')
const http = require('node:http')
const { app, BrowserWindow, shell } = require('electron')

const useDistMode = process.argv.includes('--dist')
const isDev = !app.isPackaged && !useDistMode
const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173/kof'
let distServer = null

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.jpg': 'image/jpeg',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp'
}

const resolveSafePath = (rootDir, requestPath) => {
  const relativePath = requestPath.replace(/^\/+/, '')
  const absolutePath = path.normalize(path.join(rootDir, relativePath))
  if (!absolutePath.startsWith(rootDir)) return null
  return absolutePath
}

const startDistServer = (distDir) => new Promise((resolve, reject) => {
  const server = http.createServer((request, response) => {
    const incomingPath = decodeURIComponent((request.url || '/').split('?')[0])
    const filePath = resolveSafePath(
      distDir,
      incomingPath === '/' ? '/index.html' : incomingPath
    )

    if (!filePath) {
      response.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Forbidden')
      return
    }

    let targetPath = filePath
    if (!fs.existsSync(targetPath) || fs.statSync(targetPath).isDirectory()) {
      targetPath = path.join(distDir, 'index.html')
    }

    const extName = path.extname(targetPath).toLowerCase()
    const contentType = mimeTypes[extName] || 'application/octet-stream'
    response.writeHead(200, { 'Content-Type': contentType })

    fs.createReadStream(targetPath).on('error', () => {
      response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' })
      response.end('Not Found')
    }).pipe(response)
  })

  server.once('error', reject)
  server.listen(0, '127.0.0.1', () => {
    const address = server.address()
    if (!address || typeof address === 'string') {
      reject(new Error('Failed to start local dist server'))
      return
    }
    resolve({
      server,
      url: `http://127.0.0.1:${address.port}/kof`
    })
  })
})

const createWindow = async () => {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    minWidth: 980,
    minHeight: 620,
    title: 'King of Canvas Desktop',
    backgroundColor: '#101626',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  })

  if (isDev) {
    mainWindow.loadURL(devUrl)
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
      shell.openExternal(url)
      return { action: 'deny' }
    })
    return
  }

  const distDir = path.join(__dirname, '../dist')
  const serverInfo = await startDistServer(distDir)
  distServer = serverInfo.server
  mainWindow.loadURL(serverInfo.url)
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (distServer) {
    distServer.close()
    distServer = null
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
