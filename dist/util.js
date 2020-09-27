"use strict";
exports.__esModule = true;
exports.generateElementId = exports.convertFileDataToHtmlString = exports.readFile = exports.readdirSync = exports.logError = exports.logInfo = exports.setStyleTo = exports.setContentTo = exports.addContentTo = exports.setContent = exports.addContent = exports.initUtil = void 0;
var fs = require("fs");
var webContents;
var elementIdCounter;
function initUtil(webContentsToRender) {
    webContents = webContentsToRender;
    elementIdCounter = 0;
}
exports.initUtil = initUtil;
function addContent(content) {
    webContents.executeJavaScript("document.getElementById('content').innerHTML += '" + content + "'");
}
exports.addContent = addContent;
function setContent(content) {
    webContents.executeJavaScript("document.getElementById('content').innerHTML = '" + content + "'");
}
exports.setContent = setContent;
function addContentTo(id, content) {
    webContents.executeJavaScript("document.getElementById('" + id + "').innerHTML += '" + content + "'");
}
exports.addContentTo = addContentTo;
function setContentTo(id, content) {
    webContents.executeJavaScript("document.getElementById('" + id + "').innerHTML = '" + content + "'");
}
exports.setContentTo = setContentTo;
function setStyleTo(id, style) {
    webContents.executeJavaScript("document.getElementById('" + id + "').style = '" + style + "'");
}
exports.setStyleTo = setStyleTo;
function logInfo(message) {
    log('Info: ' + message, 'grey');
}
exports.logInfo = logInfo;
function logError(message) {
    log('ERROR: ' + message, 'red');
}
exports.logError = logError;
function log(message, color) {
    console.log(message);
    var division = '<div style="color:' + color + '">' + message + '</div>';
    webContents.executeJavaScript("document.getElementById('log').innerHTML += '" + division + "'");
}
function readdirSync(path) {
    return fs.readdirSync(path, { withFileTypes: true });
}
exports.readdirSync = readdirSync;
function readFile(path, callback) {
    fs.readFile(path, 'utf-8', function (err, data) {
        if (err) {
            logError('util::readFile, ' + path + ', ' + err.message);
        }
        else {
            callback(convertFileDataToHtmlString(data));
        }
    });
}
exports.readFile = readFile;
function convertFileDataToHtmlString(fileData) {
    var content = '';
    for (var i = 0; i < fileData.length - 1; i++) {
        // TODO this is maybe very inefficient
        content += escapeCharForHtml(fileData[i]);
    }
    return content;
}
exports.convertFileDataToHtmlString = convertFileDataToHtmlString;
function escapeCharForHtml(c) {
    switch (c) {
        case '\\':
            return '&#92;';
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
function generateElementId() {
    elementIdCounter += 1;
    return 'element' + elementIdCounter;
}
exports.generateElementId = generateElementId;
//# sourceMappingURL=util.js.map