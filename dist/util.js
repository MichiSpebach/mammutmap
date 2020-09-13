"use strict";
exports.__esModule = true;
exports.log = exports.setContent = exports.addContent = exports.initUtil = void 0;
var webContents;
function initUtil(webContentsToRender) {
    webContents = webContentsToRender;
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
function log(log) {
    console.log(log);
    webContents.executeJavaScript("document.getElementById('log').innerHTML += '<br/>" + log + "'");
}
exports.log = log;
//# sourceMappingURL=util.js.map