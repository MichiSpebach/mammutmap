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
exports.addDragListenerTo = exports.addWheelListenerTo = exports.setStyleTo = exports.setContentTo = exports.insertContentTo = exports.addContentTo = exports.setContent = exports.addContent = exports.getHeightOf = exports.getWidthOf = exports.getSizeOf = exports.getClientRectOf = exports.generateElementId = exports.init = void 0;
var electron_1 = require("electron");
var webContents;
var elementIdCounter;
function init(webContentsToRender) {
    webContents = webContentsToRender;
    elementIdCounter = 0;
}
exports.init = init;
function generateElementId() {
    elementIdCounter += 1;
    return 'element' + elementIdCounter;
}
exports.generateElementId = generateElementId;
function getClientRectOf(id) {
    return __awaiter(this, void 0, void 0, function () {
        var rendererCode;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    rendererCode = '(() => {';
                    rendererCode += 'let rect = document.getElementById("' + id + '").getBoundingClientRect();';
                    rendererCode += 'return {x: rect.x, y: rect.y, width: rect.width, height: rect.height};'; // manual copy because DOMRect could not be cloned
                    rendererCode += '}).call()';
                    return [4 /*yield*/, webContents.executeJavaScript(rendererCode)];
                case 1: return [2 /*return*/, _a.sent()];
            }
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
    return executeJsOnElement(id, "offsetWidth");
}
exports.getWidthOf = getWidthOf;
function getHeightOf(id) {
    return executeJsOnElement(id, "offsetHeight");
}
exports.getHeightOf = getHeightOf;
function addContent(content) {
    addContentTo('content', content);
}
exports.addContent = addContent;
function setContent(content) {
    setContentTo('content', content);
}
exports.setContent = setContent;
function addContentTo(id, content) {
    executeJsOnElement(id, "innerHTML += '" + content + "'");
}
exports.addContentTo = addContentTo;
function insertContentTo(id, content) {
    executeJsOnElement(id, "innerHTML = '" + content + "' + document.getElementById('" + id + "').innerHTML");
}
exports.insertContentTo = insertContentTo;
function setContentTo(id, content) {
    executeJsOnElement(id, "innerHTML = '" + content + "'");
}
exports.setContentTo = setContentTo;
function setStyleTo(id, style) {
    executeJsOnElement(id, "style = '" + style + "'");
}
exports.setStyleTo = setStyleTo;
function addWheelListenerTo(id, callback) {
    var ipcChannelName = 'wheel' + id;
    var rendererFunction = '(event) => {';
    rendererFunction += 'let ipc = require("electron").ipcRenderer;';
    //rendererFunction += 'console.log(event);'
    rendererFunction += 'ipc.send("' + ipcChannelName + '", event.deltaY, event.clientX, event.clientY);';
    rendererFunction += '}';
    executeJsOnElement(id, "addEventListener('wheel', " + rendererFunction + ")");
    electron_1.ipcMain.on(ipcChannelName, function (_, deltaY, clientX, clientY) { return callback(deltaY, clientX, clientY); });
}
exports.addWheelListenerTo = addWheelListenerTo;
function addDragListenerTo(id) {
    var rendererFunction = '(event) => {';
    rendererFunction += 'console.log(event);';
    rendererFunction += '}';
    executeJsOnElement(id, "addEventListener('dragstart', " + rendererFunction + ")");
}
exports.addDragListenerTo = addDragListenerTo;
function executeJsOnElement(elementId, jsToExectue) {
    return webContents.executeJavaScript("document.getElementById('" + elementId + "')." + jsToExectue);
}
//# sourceMappingURL=domAdapter.js.map