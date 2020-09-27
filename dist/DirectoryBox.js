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
    function DirectoryBox(parent, name, id) {
        var _this = _super.call(this, parent, name, id) || this;
        _this.boxes = [];
        return _this;
    }
    DirectoryBox.prototype.render = function (widthInPercent, heightInPercent) {
        _super.prototype.setWidthInPercent.call(this, widthInPercent);
        _super.prototype.setHeightInPercent.call(this, heightInPercent);
        util.logInfo('Box::render ' + _super.prototype.getPath.call(this));
        this.renderStyle();
        _super.prototype.renderHeader.call(this);
        this.renderBody();
    };
    DirectoryBox.prototype.renderStyle = function () {
        var basicStyle = 'display:inline-block;overflow:auto;';
        var scaleStyle = 'width:' + _super.prototype.getWidthInPercent.call(this) + '%;height:' + _super.prototype.getHeightInPercent.call(this) + '%;';
        var borderStyle = 'border:dotted;border-color:skyblue;';
        util.setStyleTo(_super.prototype.getId.call(this), basicStyle + scaleStyle + borderStyle);
    };
    DirectoryBox.prototype.renderBody = function () {
        var _this = this;
        util.readdirSync(_super.prototype.getPath.call(this)).forEach(function (file) {
            var fileName = file.name;
            var filePath = _super.prototype.getPath.call(_this) + '/' + fileName;
            if (file.isDirectory()) {
                util.logInfo('Box::render directory ' + filePath);
                _this.boxes.push(_this.createDirectoryBox(fileName));
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
    DirectoryBox.prototype.createDirectoryBox = function (name) {
        var elementId = this.renderBoxPlaceholderAndReturnId(name);
        return new DirectoryBox(this, name, elementId);
    };
    DirectoryBox.prototype.createFileBox = function (name) {
        var elementId = this.renderBoxPlaceholderAndReturnId(name);
        return new FileBox_1.FileBox(this, name, elementId);
    };
    DirectoryBox.prototype.renderBoxPlaceholderAndReturnId = function (name) {
        var elementId = util.generateElementId();
        util.addContentTo(_super.prototype.getId.call(this), '<div id="' + elementId + '" style="display:inline-block;">loading... ' + name + '</div>');
        return elementId;
    };
    return DirectoryBox;
}(Box_1.Box));
exports.DirectoryBox = DirectoryBox;
//# sourceMappingURL=DirectoryBox.js.map