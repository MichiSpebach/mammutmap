import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import * as domAdapter from './domAdapter'
import * as commandLine from './commandLine'
import { applicationMenu } from './applicationMenu/applicationMenu'
import * as pluginLoader from './pluginLoader'
import { util } from './util'

var mainWindow: BrowserWindow

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = async () => {
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'))
  
  domAdapter.initFromBrowserWindow(mainWindow)
  commandLine.init()

  if (process.platform !== 'darwin') {
    await applicationMenu.initAndRender()
  }

  await pluginLoader.loadPlugins()

  if (process.platform === 'darwin') {
    let message: string = 'macOS detected, initializing applicationMenu after plugins have loaded'
    message += ' because dynamically changing menus might not work in macOS.\n'
    message += 'When problems with the applicationMenu occur you can activate htmlApplicationMenu in the settings.'
    util.logInfo(message)
    await applicationMenu.initAndRender()
  }
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
