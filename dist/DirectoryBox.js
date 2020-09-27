"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
exports.__esModule = true;
exports.DirectoryBox = void 0;
var util = require("./util");
var Box_1 = require("./Box");
var FileBox_1 = require("./FileBox");
var DirectoryBox = /** @class */ (function (_super) {
    __extends(DirectoryBox, _super);
    function DirectoryBox(directoryPath, id) {
        var _this = _super.call(this, null, directoryPath, id) || this;
        _this.boxes = [];
        return _this;
    }
    DirectoryBox.prototype.render = function (widthInPercent, heightInPercent) {
        var _this = this;
        _super.prototype.setWidthInPercent.call(this, widthInPercent);
        _super.prototype.setHeightInPercent.call(this, heightInPercent);
        util.logInfo('Box::render ' + _super.prototype.getPath.call(this));
        util.readdirSync(_super.prototype.getPath.call(this)).forEach(function (file) {
            var fileName = file.name;
            var filePath = _super.prototype.getPath.call(_this) + '/' + fileName;
            if (file.isDirectory()) {
                util.logInfo('Box::render directory ' + filePath);
                _this.renderDirectory(fileName);
            }
            else if (file.isFile()) {
                util.logInfo('Box::render file ' + filePath);
                _this.boxes.push(_this.createFileBox(fileName));
            }
            else {
                util.logError('Box::render ' + filePath + ' is neither file nor directory.');
            }
        });
        this.boxes.forEach(function (box) {
            box.render(49, 2 * 80 / _this.boxes.length);
        });
    };
    DirectoryBox.prototype.renderDirectory = function (name) {
        util.addContent('<div style="display:inline-block;border:dotted;border-color:skyblue;">' + name + '</div>');
    };
    DirectoryBox.prototype.createFileBox = function (name) {
        var elementId = util.generateElementId();
        util.addContent('<div id="' + elementId + '" style="display:inline-block;">loading...' + name + '</div>');
        return new FileBox_1.FileBox(this, name, elementId);
    };
    return DirectoryBox;
}(Box_1.Box));
exports.DirectoryBox = DirectoryBox;
//# sourceMappingURL=DirectoryBox.js.map