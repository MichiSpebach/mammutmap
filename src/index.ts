import { app, BrowserWindow } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

var mainWindow: BrowserWindow

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    height: 800,
    width: 1600,
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, '../src/index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();

  visualizeDirectory("./src")
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

function visualizeDirectory(relativePath: string): void {
  log('visualizeDirectory')
  fs.readdirSync(relativePath).forEach(file => {
    log(file);
    visualizeFile(relativePath, file)
  });
}

function visualizeFile(directoryPath: string, fileName: string): void {
  let filePath: string = directoryPath + '/' + fileName;
  log("visualizeFile " + filePath)
  fs.readFile(filePath, 'utf-8', (err, data) => {
      if(err) {
        log('visualizeFile ' + filePath + ': interpret error as directory:' + err.message)
        addContent(formDirectoryBox(fileName))
      } else {
        log('visualizeFile ' + filePath + ': file length of is ' + data.length)
        let fileContent: string = convertFileDataToHtmlString(data)
        addContent(formFileBox(fileName, fileContent))
      }
  })
}

function convertFileDataToHtmlString(fileData: string): string {
  var content: string = '';
  for (let i = 0; i < fileData.length-1; i++) {
    content += escapeCharForHtml(fileData[i])
  }
  return '<pre style="margin:0px">' + content + '</pre>'
}

function escapeCharForHtml(c: string): string {
  switch (c) {
    case '\n':
      return '<br/>'
    case '\'':
      return '&#39;'
    case '"':
      return '&quot;'
    case '<':
      return '&lt;'
    case '>':
      return '&gt;'
    default:
      return c
  }
}

function formDirectoryBox(name: string) {
  return '<div style="display:inline-block;border:dotted;border-color:skyblue">' + name + '</div>'
}

function formFileBox(name: string, content: string): string {
  return '<div style="display:inline-block">' + name + '<div style="border:solid;border-color:skyblue">' + content + '</div></div>'
}

function addContent(content: string): void {
  mainWindow.webContents.executeJavaScript("document.getElementById('content').innerHTML += '" + content + "'")
}

function setContent(content: string): void {
  mainWindow.webContents.executeJavaScript("document.getElementById('content').innerHTML = '" + content + "'")
}

function log(log: string): void {
  console.log(log)
  mainWindow.webContents.executeJavaScript("document.getElementById('log').innerHTML += '<br/>" + log + "'")
}
