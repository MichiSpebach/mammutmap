"use strict";
exports.__esModule = true;
exports.Rect = void 0;
var Rect = /** @class */ (function () {
    function Rect(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
    }
    Rect.prototype.isPositionInside = function (x, y) {
        return x >= this.x && y >= this.y && x <= this.x + this.width && y <= this.y + this.height;
    };
    return Rect;
}());
exports.Rect = Rect;
//# sourceMappingURL=Rect.js.map