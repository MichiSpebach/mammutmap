"use strict";
exports.__esModule = true;
exports.BoxData = void 0;
var util = require("./util");
var BoxData = /** @class */ (function () {
    function BoxData() {
    }
    BoxData.prototype.validate = function () {
        this.warnIf(this.x == null, 'x is null');
        this.warnIf(this.y == null, 'y is null');
        this.warnIf(this.width == null, 'width is null');
        this.warnIf(this.height == null, 'height is null');
        this.warnIf(this.x == undefined, 'x is undefined');
        this.warnIf(this.y == undefined, 'y is undefined');
        this.warnIf(this.width == undefined, 'width is undefined');
        this.warnIf(this.height == undefined, 'height is undefined');
        if (this.x == null || this.y == null || this.width == null || this.height == null) {
            return;
        }
        this.warnIf(this.x < 0, 'x is less than 0');
        this.warnIf(this.y < 0, 'y is less than 0');
        this.warnIf(this.width <= 0, 'width is not positive');
        this.warnIf(this.height <= 0, 'height is not positive');
        this.warnIf(this.x + this.width > 100, 'sum of x and width is greater than 100');
        this.warnIf(this.y + this.height > 100, 'sum of y and height is greater than 100');
    };
    BoxData.prototype.warnIf = function (condition, message) {
        if (condition) {
            this.warn(message);
        }
    };
    BoxData.prototype.warn = function (message) {
        util.logWarning('BoxData: ' + message);
    };
    return BoxData;
}());
exports.BoxData = BoxData;
//# sourceMappingURL=BoxData.js.map