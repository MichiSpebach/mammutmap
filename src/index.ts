import { app, BrowserWindow } from 'electron'
import * as path from 'path'
import * as domAdapter from './core/domAdapter'
import * as commandLine from './core/commandLine'
import * as applicationMenu from './core/applicationMenu/applicationMenu'
import * as pluginLoader from './core/pluginLoader'
import { util } from './core/util/util'
import { mainWidget } from './core/mainWidget'
import { ElectronIpcDomAdapter } from './ElectronIpcDomAdapter'
import * as fileSystemAdapter from './core/fileSystemAdapter'
import { NodeJsFileSystemAdapter } from './NodeJsFileSystemAdapter'
import * as settings from './core/Settings'
import { ElectronAndHtmlApplicationMenu } from './ElectronAndHtmlApplicationMenu'
import * as contextMenu from './core/contextMenu'
import { ElectronContextMenuPopup } from './ElectronContextMenuPopup'

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

  mainWindow.loadFile(path.join(__dirname, '../src/core/index.html'))

  domAdapter.init(new ElectronIpcDomAdapter(mainWindow))
  fileSystemAdapter.init(new NodeJsFileSystemAdapter())
  await settings.init()
  mainWidget.render()
  commandLine.init()
  contextMenu.init(new ElectronContextMenuPopup())

  if (process.platform !== 'darwin') {
    await applicationMenu.initAndRender(new ElectronAndHtmlApplicationMenu())
  }

  if (getStartupArgumentBoolean('skip-plugins')) {
    util.logInfo('skip loading of plugins because --skip-plugins=true')
  } else {
    await pluginLoader.loadPlugins()
  }

  if (process.platform === 'darwin') {
    let message: string = 'macOS detected, initializing applicationMenu after plugins have loaded'
    message += ' because dynamically changing menus might not work in macOS.\n'
    message += 'When problems with the applicationMenu occur you can activate htmlApplicationMenu in the settings.'
    util.logInfo(message)
    await applicationMenu.initAndRender(new ElectronAndHtmlApplicationMenu())
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

function getStartupArgumentBoolean(argName: 'skip-plugins'): boolean {
  const value = app.commandLine.getSwitchValue(argName)
  if (value === 'true') {
    return true
  }
  if (!value || value === 'false') {
    return false
  }
  util.logWarning(`Expected argument "${argName}" to be "true" or "false" but is "${value}", defaulting to false.`)
  return false
}