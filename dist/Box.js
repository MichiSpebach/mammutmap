"use strict";
exports.__esModule = true;
exports.Box = void 0;
var util = require("./util");
var Box = /** @class */ (function () {
    function Box(directoryPath) {
        this.path = directoryPath;
    }
    Box.prototype.visualize = function () {
        var _this = this;
        util.logInfo('Box::visualize ' + this.path);
        util.readdirSync(this.path).forEach(function (file) {
            var fileName = file.name;
            var filePath = _this.path + '/' + fileName;
            if (file.isDirectory()) {
                util.logInfo('Box::visualize directory ' + filePath);
                _this.visualizeDirectory(fileName);
            }
            else if (file.isFile()) {
                util.logInfo('Box::visualize file ' + filePath);
                _this.visualizeFile(fileName);
            }
            else {
                util.logError('Box::visualize ' + filePath + ' is neither file nor directory.');
            }
        });
    };
    Box.prototype.visualizeDirectory = function (name) {
        util.addContent(this.formDirectoryBox(name));
    };
    Box.prototype.visualizeFile = function (name) {
        var _this = this;
        var filePath = this.path + '/' + name;
        util.readFile(filePath, function (dataConvertedToHtml) {
            util.addContent(_this.formFileBox(name, dataConvertedToHtml));
        });
    };
    Box.prototype.formDirectoryBox = function (name) {
        return '<div style="display:inline-block;border:dotted;border-color:skyblue">' + name + '</div>';
    };
    Box.prototype.formFileBox = function (name, content) {
        var preformattedContent = '<pre style="margin:0px">' + content + '</pre>';
        var contentDivision = '<div style="border:solid;border-color:skyblue">' + preformattedContent + '</div>';
        return '<div style="display:inline-block">' + name + contentDivision + '</div>';
    };
    return Box;
}());
exports.Box = Box;
//# sourceMappingURL=Box.js.map