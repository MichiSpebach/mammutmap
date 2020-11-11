"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
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
var util = require("../util");
var dom = require("../domAdapter");
var Box_1 = require("./Box");
var FileBox_1 = require("./FileBox");
var Path_1 = require("../Path");
var DirectoryBox = /** @class */ (function (_super) {
    __extends(DirectoryBox, _super);
    function DirectoryBox(path, id, parent) {
        var _this = _super.call(this, path, id, parent) || this;
        _this.boxes = [];
        _this.dragOver = false;
        return _this;
    }
    DirectoryBox.prototype.getOverflow = function () {
        return 'visible';
    };
    DirectoryBox.prototype.getBorderStyle = function () {
        var backgroundStyle = ''; // TODO: move to better place
        if (this.dragOver) {
            backgroundStyle = 'background-color:#0000FF88';
        }
        else {
            backgroundStyle = 'background-color:#00000000';
        }
        return 'border:dotted;border-color:skyblue;' + backgroundStyle;
    };
    DirectoryBox.prototype.setDragOverStyle = function (value) {
        this.dragOver = value;
        _super.prototype.renderStyle.call(this);
    };
    DirectoryBox.prototype.renderBody = function () {
        var _this = this;
        util.readdirSync(_super.prototype.getPath.call(this).getSrcPath()).forEach(function (file) {
            var fileName = file.name;
            var filePath = _super.prototype.getPath.call(_this).getSrcPath() + '/' + fileName;
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
            box.render();
        });
    };
    DirectoryBox.prototype.createDirectoryBox = function (name) {
        var elementId = this.renderBoxPlaceholderAndReturnId(name);
        return new DirectoryBox(Path_1.Path.buildDirEntry(_super.prototype.getPath.call(this), name), elementId, this);
    };
    DirectoryBox.prototype.createFileBox = function (name) {
        var elementId = this.renderBoxPlaceholderAndReturnId(name);
        return new FileBox_1.FileBox(Path_1.Path.buildDirEntry(_super.prototype.getPath.call(this), name), elementId, this);
    };
    DirectoryBox.prototype.renderBoxPlaceholderAndReturnId = function (name) {
        var elementId = dom.generateElementId();
        dom.addContentTo(_super.prototype.getId.call(this), '<div id="' + elementId + '" style="display:inline-block;">loading... ' + name + '</div>');
        return elementId;
    };
    DirectoryBox.prototype.containsBox = function (box) {
        return this.boxes.includes(box);
    };
    DirectoryBox.prototype.addBox = function (box) {
        if (this.containsBox(box)) {
            util.logWarning('DirectoryBox.addBox: trying to add box that is already contained');
        }
        this.boxes.push(box);
        dom.appendChildTo(_super.prototype.getId.call(this), box.getId());
    };
    DirectoryBox.prototype.removeBox = function (box) {
        if (!this.containsBox(box)) {
            util.logWarning('DirectoryBox.removeBox: trying to remove box that is not contained');
        }
        this.boxes.splice(this.boxes.indexOf(box), 1);
        // TODO: try to remove from dom?
    };
    return DirectoryBox;
}(Box_1.Box));
exports.DirectoryBox = DirectoryBox;
//# sourceMappingURL=DirectoryBox.js.map