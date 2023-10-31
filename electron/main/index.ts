import { app, Menu, BrowserWindow, shell, ipcMain } from 'electron'
import { release } from 'node:os'
import { join } from 'node:path'
import Store from 'electron-store'
import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';


const store = new Store({
	animes: {
    type: 'object',
    propertyNames: {
      format: "string"
    },
    additionalProperties: {
      title: {
        type: 'string'
      },
      day: {
        type: 'string'
      },
      episodes: {
        type: 'number',
        minimum: 1,
        default: 0
      }
    }
	},
	bounds: {
    type: 'object'
	}
});

// The built directory structure
//
// ├─┬ dist-electron
// │ ├─┬ main
// │ │ └── index.js    > Electron-Main
// │ └─┬ preload
// │   └── index.js    > Preload-Scripts
// ├─┬ dist
// │ └── index.html    > Electron-Renderer
//
process.env.DIST_ELECTRON = join(__dirname, '..')
process.env.DIST = join(process.env.DIST_ELECTRON, '../dist')
process.env.VITE_PUBLIC = process.env.VITE_DEV_SERVER_URL
  ? join(process.env.DIST_ELECTRON, '../public')
  : process.env.DIST

// Disable GPU Acceleration for Windows 7
if (release().startsWith('6.1')) app.disableHardwareAcceleration()

// Set application name for Windows 10+ notifications
if (process.platform === 'win32') app.setAppUserModelId(app.getName())

if (!app.requestSingleInstanceLock()) {
  app.quit()
  process.exit(0)
}

// Remove electron security warnings
// This warning only shows in development mode
// Read more on https://www.electronjs.org/docs/latest/tutorial/security
// process.env['ELECTRON_DISABLE_SECURITY_WARNINGS'] = 'true'

let win: BrowserWindow | null = null
// Here, you can also use other preload
const preload = join(__dirname, '../preload/index.js')
const url = process.env.VITE_DEV_SERVER_URL
const indexHtml = join(process.env.DIST, 'index.html')

async function createWindow() {
  win = new BrowserWindow({
    width: store.get('bounds.width', 450),
    height: store.get('bounds.height', 450),
    x: store.get('bounds.x', null),
    y: store.get('bounds.y', null),
    autoHideMenuBar: true,
    frame: false,
    icon: null,
    minHeight: 315,
    minWidth: 315,
    skipTaskbar: false,
    webPreferences: {
      preload,
      // Warning: Enable nodeIntegration and disable contextIsolation is not secure in production
      // Consider using contextBridge.exposeInMainWorld
      // Read more on https://www.electronjs.org/docs/latest/tutorial/context-isolation
      contextIsolation: true,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) { // electron-vite-vue#298
    win.loadURL(url)
    // Open devTool if the app is not packaged
    win.webContents.openDevTools()
  } else {
    win.loadFile(indexHtml)
  }

  // Test actively push message to the Electron-Renderer
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', new Date().toLocaleString())
  })

  // Make all links open with the browser, not with the application
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https:')) shell.openExternal(url)
    return { action: 'deny' }
  })
  // win.webContents.on('will-navigate', (event, url) => { }) #344

  win.on('move', () => {
    store.set('bounds', win.getBounds());
  });

  win.on('close', () => {
    store.set('bounds', win.getBounds());
  });
}

// app.whenReady().then(createWindow)

app.whenReady().then(() => {
  const win = createWindow();

  const sourceFilePath = path.join(__dirname, 'styles', 'custom_style.css');
  const appDataPath = app.getPath('userData');
  const destinationFilePath = path.join(appDataPath, 'custom_style.css');

  if (!fs.existsSync(appDataPath)) {
    fs.mkdirSync(appDataPath, { recursive: true });
  }

  fs.copyFileSync(sourceFilePath, destinationFilePath);
})

app.on('window-all-closed', () => {
  win = null
  if (process.platform !== 'darwin') app.quit()
})

app.on('second-instance', () => {
  if (win) {
    // Focus on the main window if the user tried to open another
    if (win.isMinimized()) win.restore()
    win.focus()
  }
})

app.on('activate', () => {
  const allWindows = BrowserWindow.getAllWindows()
  if (allWindows.length) {
    allWindows[0].focus()
  } else {
    createWindow()
  }
})

// New window example arg: new windows url
ipcMain.handle('open-win', (_, arg) => {
  const childWindow = new BrowserWindow({
    webPreferences: {
      preload,
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  if (process.env.VITE_DEV_SERVER_URL) {
    childWindow.loadURL(`${url}#${arg}`)
  } else {
    childWindow.loadFile(indexHtml, { hash: arg })
  }
})


ipcMain.handle('addAnime', (e, day, title) => {
  store.set('animes', {
    ...store.get('animes'),
    [uuidv4()]: {
      title: title,
      day: day,
      episodes: 0,
    }
  });
});
ipcMain.handle('getAnimes', () => {
  return store.get('animes');
});
ipcMain.handle('getAnime', (e, uuid) => {
  return store.get(`animes.${uuid}`);
});
ipcMain.handle('editAnime', (e, uuid, day, title) => {
  store.set(`animes.${uuid}.day`, day);
  store.set(`animes.${uuid}.title`, title);
});
ipcMain.handle('setEpisodes', (e, uuid, nbEpisodes) => {
  store.set(`animes.${uuid}.episodes`, nbEpisodes);
});
ipcMain.handle('deleteAnime', (e, uuid) => {
  store.delete(`animes.${uuid}`);
});

ipcMain.on('show-context-menu', (event, uuid, x, y) => {
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Éditer',
      click: () => {
        win.webContents.executeJavaScript(`window.editAnime('${uuid}');`);
      }
    },
    {
      label: 'Supprimer',
      click: () => {
        store.delete(`animes.${uuid}`);
        win.webContents.executeJavaScript("window.refreshList();");
      }
    }
  ]);

  contextMenu.popup({ window: win, x, y });
});