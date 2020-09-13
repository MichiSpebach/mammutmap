"use strict";
exports.__esModule = true;
exports.Box = void 0;
var fs = require("fs");
var util = require("./util");
var Box = /** @class */ (function () {
    function Box(directoryPath) {
        this.path = directoryPath;
    }
    Box.prototype.visualizeDirectory = function () {
        var _this = this;
        util.log('visualizeDirectory');
        fs.readdirSync(this.path).forEach(function (file) {
            util.log(file);
            _this.visualizeFile(_this.path, file);
        });
    };
    Box.prototype.visualizeFile = function (directoryPath, fileName) {
        var _this = this;
        var filePath = directoryPath + '/' + fileName;
        util.log("visualizeFile " + filePath);
        fs.readFile(filePath, 'utf-8', function (err, data) {
            if (err) {
                util.log('visualizeFile ' + filePath + ': interpret error as directory:' + err.message);
                util.addContent(_this.formDirectory(fileName));
            }
            else {
                util.log('visualizeFile ' + filePath + ': file length of is ' + data.length);
                var fileContent = _this.convertFileDataToHtmlString(data);
                util.addContent(_this.formFile(fileName, fileContent));
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
    return Box;
}());
exports.Box = Box;
//# sourceMappingURL=Box.js.map