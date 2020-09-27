"use strict";
exports.__esModule = true;
exports.Box = void 0;
var Box = /** @class */ (function () {
    function Box(parent, name, id) {
        this.widthInPercent = 0;
        this.heightInPercent = 0;
        this.parent = parent;
        this.name = name;
        this.id = id;
    }
    Box.prototype.getId = function () {
        return this.id;
    };
    Box.prototype.getName = function () {
        return this.name;
    };
    Box.prototype.getWidthInPercent = function () {
        return this.widthInPercent;
    };
    Box.prototype.setWidthInPercent = function (widthInPercent) {
        this.widthInPercent = widthInPercent;
    };
    Box.prototype.getHeightInPercent = function () {
        return this.heightInPercent;
    };
    Box.prototype.setHeightInPercent = function (heightInPercent) {
        this.heightInPercent = heightInPercent;
    };
    Box.prototype.getPath = function () {
        if (this.parent == null) {
            return this.name;
        }
        return this.parent.getPath() + '/' + this.name;
    };
    return Box;
}());
exports.Box = Box;
//# sourceMappingURL=Box.js.map