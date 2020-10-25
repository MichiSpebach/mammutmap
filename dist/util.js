"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.generateElementId = exports.escapeForHtml = exports.readFileAndConvertToHtml = exports.readFile = exports.readdirSync = exports.stringify = exports.logError = exports.logWarning = exports.logInfo = exports.setStyleTo = exports.setContentTo = exports.addContentTo = exports.setContent = exports.addContent = exports.addWheelListenerTo = exports.getHeightOf = exports.getWidthOf = exports.getSizeOf = exports.getClientRectOf = exports.initUtil = void 0;
var electron_1 = require("electron");
var fs = require("fs");
var fs_1 = require("fs");
var webContents;
var elementIdCounter;
function initUtil(webContentsToRender) {
    webContents = webContentsToRender;
    elementIdCounter = 0;
}
exports.initUtil = initUtil;
function getClientRectOf(id) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // doesn't work, maybe object cannot be transferred from render thread
            return [2 /*return*/, webContents.executeJavaScript("document.getElementById('" + id + "').getBoundingClientRect()")];
        });
    });
}
exports.getClientRectOf = getClientRectOf;
function getSizeOf(id) {
    return __awaiter(this, void 0, void 0, function () {
        var widthPromise, heightPromise, width, height;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    widthPromise = getWidthOf(id);
                    heightPromise = getHeightOf(id);
                    return [4 /*yield*/, widthPromise];
                case 1:
                    width = _a.sent();
                    return [4 /*yield*/, heightPromise];
                case 2:
                    height = _a.sent();
                    return [2 /*return*/, { width: width, height: height }];
            }
        });
    });
}
exports.getSizeOf = getSizeOf;
function getWidthOf(id) {
    return webContents.executeJavaScript("document.getElementById('" + id + "').offsetWidth");
}
exports.getWidthOf = getWidthOf;
function getHeightOf(id) {
    return webContents.executeJavaScript("document.getElementById('" + id + "').offsetHeight");
}
exports.getHeightOf = getHeightOf;
function addWheelListenerTo(id, callback) {
    var ipcChannelName = 'wheel' + id;
    var rendererFunction = '(event) => {';
    rendererFunction += 'let ipc = require("electron").ipcRenderer;';
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'ipc.send("' + ipcChannelName + '", event.deltaY, event.clientX, event.clientY);';
    rendererFunction += '}';
    webContents.executeJavaScript("document.getElementById('" + id + "').addEventListener('wheel', " + rendererFunction + ")");
    electron_1.ipcMain.on(ipcChannelName, function (_, deltaY, clientX, clientY) { return callback(deltaY, clientX, clientY); });
}
exports.addWheelListenerTo = addWheelListenerTo;
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
function logWarning(message) {
    log('WARNING: ' + message, 'orange');
}
exports.logWarning = logWarning;
function logError(message) {
    log('ERROR: ' + message, 'red');
}
exports.logError = logError;
function log(message, color) {
    console.log(message);
    var division = '<div style="color:' + color + '">' + escapeForHtml(message) + '</div>';
    webContents.executeJavaScript("document.getElementById('log').innerHTML = '" + division + "' + document.getElementById('log').innerHTML");
}
function stringify(object) {
    var stringifiedObject = object + ': ';
    for (var key in object) {
        //if(typeof rect[key] !== 'function') {
        stringifiedObject += key + '=' + object[key] + '; ';
        //}
    }
    return stringifiedObject;
}
exports.stringify = stringify;
function readdirSync(path) {
    return fs.readdirSync(path, { withFileTypes: true });
}
exports.readdirSync = readdirSync;
function readFile(path) {
    return fs_1.promises.readFile(path, 'utf-8');
}
exports.readFile = readFile;
function readFileAndConvertToHtml(path, callback) {
    fs.readFile(path, 'utf-8', function (err, data) {
        if (err) {
            logError('util::readFile, ' + path + ', ' + err.message);
        }
        else {
            callback(escapeForHtml(data));
        }
    });
}
exports.readFileAndConvertToHtml = readFileAndConvertToHtml;
function escapeForHtml(text) {
    var content = '';
    for (var i = 0; i < text.length - 1; i++) {
        // TODO this is maybe very inefficient
        content += escapeCharForHtml(text[i]);
    }
    return content;
}
exports.escapeForHtml = escapeForHtml;
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