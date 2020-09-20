"use strict";
exports.__esModule = true;
exports.Box = void 0;
var util = require("./util");
var FileBox_1 = require("./FileBox");
var Box = /** @class */ (function () {
    function Box(directoryPath) {
        this.path = directoryPath;
    }
    Box.prototype.getPath = function () {
        return this.path;
    };
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
        util.addContent('<div style="display:inline-block;border:dotted;border-color:skyblue">' + name + '</div>');
    };
    Box.prototype.visualizeFile = function (name) {
        var boxId = util.generateDivId();
        util.addContent('<div id="' + boxId + '" style="display:inline-block">' + name + '</div>');
        var box = new FileBox_1.FileBox(this, name, boxId);
        box.render();
    };
    return Box;
}());
exports.Box = Box;
//# sourceMappingURL=Box.js.map