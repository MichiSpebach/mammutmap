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
        height: 800,
        width: 1600
    });
    // and load the index.html of the app.
    mainWindow.loadFile(path.join(__dirname, '../src/index.html'));
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
    visualizeDirectory("./src");
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
function visualizeDirectory(relativePath) {
    log('visualizeDirectory');
    fs.readdirSync(relativePath).forEach(function (file) {
        log(file);
        visualizeFile(relativePath, file);
    });
}
function visualizeFile(directoryPath, fileName) {
    var filePath = directoryPath + '/' + fileName;
    log("visualizeFile " + filePath);
    fs.readFile(filePath, 'utf-8', function (err, data) {
        if (err) {
            log('visualizeFile ' + filePath + ': interpret error as directory:' + err.message);
            addContent(formDirectoryBox(fileName));
        }
        else {
            log('visualizeFile ' + filePath + ': file length of is ' + data.length);
            var fileContent = convertFileDataToHtmlString(data);
            addContent(formFileBox(fileName, fileContent));
        }
    });
}
function convertFileDataToHtmlString(fileData) {
    var content = '';
    for (var i = 0; i < fileData.length - 1; i++) {
        content += escapeCharForHtml(fileData[i]);
    }
    return '<pre style="margin:0px">' + content + '</pre>';
}
function escapeCharForHtml(c) {
    switch (c) {
        case '\n':
            return '<br/>';
        case '\'':
            return '&#39;';
        case '"':
            return '&quot;';
        case '<':
            return '&lt;';
        case '>':
            return '&gt;';
        case '&':
            return '&amp';
        default:
            return c;
    }
}
function formDirectoryBox(name) {
    return '<div style="display:inline-block;border:dotted;border-color:skyblue">' + name + '</div>';
}
function formFileBox(name, content) {
    return '<div style="display:inline-block">' + name + '<div style="border:solid;border-color:skyblue">' + content + '</div></div>';
}
function addContent(content) {
    mainWindow.webContents.executeJavaScript("document.getElementById('content').innerHTML += '" + content + "'");
}
function setContent(content) {
    mainWindow.webContents.executeJavaScript("document.getElementById('content').innerHTML = '" + content + "'");
}
function log(log) {
    console.log(log);
    mainWindow.webContents.executeJavaScript("document.getElementById('log').innerHTML += '<br/>" + log + "'");
}
//# sourceMappingURL=index.js.map