"use strict";
exports.__esModule = true;
exports.Box = void 0;
var fs = require("fs");
var Box = /** @class */ (function () {
    function Box(directoryPath, mainWindow) {
        this.path = directoryPath;
        this.mainWindow = mainWindow;
    }
    Box.prototype.visualizeDirectory = function () {
        var _this = this;
        this.log('visualizeDirectory');
        fs.readdirSync(this.path).forEach(function (file) {
            _this.log(file);
            _this.visualizeFile(_this.path, file);
        });
    };
    Box.prototype.visualizeFile = function (directoryPath, fileName) {
        var _this = this;
        var filePath = directoryPath + '/' + fileName;
        this.log("visualizeFile " + filePath);
        fs.readFile(filePath, 'utf-8', function (err, data) {
            if (err) {
                _this.log('visualizeFile ' + filePath + ': interpret error as directory:' + err.message);
                _this.addContent(_this.formDirectory(fileName));
            }
            else {
                _this.log('visualizeFile ' + filePath + ': file length of is ' + data.length);
                var fileContent = _this.convertFileDataToHtmlString(data);
                _this.addContent(_this.formFile(fileName, fileContent));
            }
        });
    };
    Box.prototype.convertFileDataToHtmlString = function (fileData) {
        var content = '';
        for (var i = 0; i < fileData.length - 1; i++) {
            content += this.escapeCharForHtml(fileData[i]);
        }
        return '<pre style="margin:0px">' + content + '</pre>';
    };
    Box.prototype.escapeCharForHtml = function (c) {
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
    };
    Box.prototype.formDirectory = function (name) {
        return '<div style="display:inline-block;border:dotted;border-color:skyblue">' + name + '</div>';
    };
    Box.prototype.formFile = function (name, content) {
        return '<div style="display:inline-block">' + name + '<div style="border:solid;border-color:skyblue">' + content + '</div></div>';
    };
    Box.prototype.addContent = function (content) {
        this.mainWindow.webContents.executeJavaScript("document.getElementById('content').innerHTML += '" + content + "'");
    };
    Box.prototype.setContent = function (content) {
        this.mainWindow.webContents.executeJavaScript("document.getElementById('content').innerHTML = '" + content + "'");
    };
    Box.prototype.log = function (log) {
        console.log(log);
        this.mainWindow.webContents.executeJavaScript("document.getElementById('log').innerHTML += '<br/>" + log + "'");
    };
    return Box;
}());
exports.Box = Box;
//# sourceMappingURL=Box.js.map