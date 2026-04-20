const path = require('node:path')
const { app, BrowserWindow, shell } = require('electron')

const useDistMode = process.argv.includes('--dist')
const isDev = !app.isPackaged && !useDistMode
const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://127.0.0.1:5173/kof'

const createWindow = () => {
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

  const indexPath = path.join(__dirname, '../dist/index.html')
  mainWindow.loadFile(indexPath, { hash: '/kof' })
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
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
