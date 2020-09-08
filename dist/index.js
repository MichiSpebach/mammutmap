"use strict";
exports.__esModule = true;
var electron_1 = require("electron");
var path = require("path");
var fs = require("fs");
var mainWindow;
// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) { // eslint-disable-line global-require
    electron_1.app.quit();
}
var createWindow = function () {
    // Create the browser window.
    mainWindow = new electron_1.BrowserWindow({
        height: 600,
        width: 800
    });
    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
    setContent('content was set');
    log('log panel works');
    visualizeFile('testfile.txt');
};
// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron_1.app.on('ready', createWindow);
// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
electron_1.app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', function () {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.
function visualizeFile(fileName) {
    log("visualizeFile");
    fs.readFile(fileName, 'utf-8', function (err, data) {
        log('listFiles2');
        if (err) {
            log('An error occurred reading the file :' + err.message);
        }
        else {
            log('listFiles success, file length is ' + data.length);
            var fileContent = convertFileDataToHtmlString(data);
            setContent(createFileBox(fileName, fileContent));
        }
    });
}
function convertFileDataToHtmlString(fileData) {
    var string = '';
    for (var i = 0; i < fileData.length - 1; i++) {
        if (fileData[i] === '\n') {
            string += '<br/>';
        }
        else {
            string += fileData[i];
        }
    }
    return string;
}
function createFileBox(name, content) {
    return '<div style="display:inline-block">' + name + '<div style="border:solid;border-color:skyblue">' + content + '</div></div>';
}
function setContent(content) {
    mainWindow.webContents.executeJavaScript("document.getElementById('content').innerHTML = '" + content + "'");
}
function log(log) {
    console.log(log);
    mainWindow.webContents.executeJavaScript("document.getElementById('log').innerHTML += '<br/>" + log + "'");
}
//# sourceMappingURL=index.js.map