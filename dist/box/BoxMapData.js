"use strict";
exports.__esModule = true;
exports.BoxMapData = void 0;
var util = require("../util");
var BoxMapData = /** @class */ (function () {
    function BoxMapData(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.validate();
    }
    BoxMapData.buildDefault = function () {
        return new BoxMapData(10, 10, 80, 80);
    };
    BoxMapData.buildFromJson = function (json) {
        var parsedData = JSON.parse(json); // parsed object has no functions
        return new BoxMapData(parsedData.x, parsedData.y, parsedData.width, parsedData.height);
    };
    BoxMapData.prototype.validate = function () {
        this.warnIf(this.x == null, 'x is null');
        this.warnIf(this.y == null, 'y is null');
        this.warnIf(this.width == null, 'width is null');
        this.warnIf(this.height == null, 'height is null');
        this.warnIf(this.x == undefined, 'x is undefined');
        this.warnIf(this.y == undefined, 'y is undefined');
        this.warnIf(this.width == undefined, 'width is undefined');
        this.warnIf(this.height == undefined, 'height is undefined');
        this.warnIf(this.x < 0, 'x is less than 0');
        this.warnIf(this.y < 0, 'y is less than 0');
        this.warnIf(this.width <= 0, 'width is not positive');
        this.warnIf(this.height <= 0, 'height is not positive');
        this.warnIf(this.x + this.width > 100, 'sum of x and width is greater than 100');
        this.warnIf(this.y + this.height > 100, 'sum of y and height is greater than 100');
    };
    BoxMapData.prototype.warnIf = function (condition, message) {
        if (condition) {
            this.warn(message);
        }
    };
    BoxMapData.prototype.warn = function (message) {
        util.logWarning('BoxData: ' + message);
    };
    BoxMapData.prototype.toJson = function () {
        return JSON.stringify(this);
    };
    return BoxMapData;
}());
exports.BoxMapData = BoxMapData;
//# sourceMappingURL=BoxMapData.js.map