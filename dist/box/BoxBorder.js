"use strict";
exports.__esModule = true;
exports.BoxBorder = void 0;
var dom = require("../domAdapter");
//import { ScaleManager } from '../ScaleManager'
var BoxBorder = /** @class */ (function () {
    function BoxBorder(referenceBox) {
        this.referenceBox = referenceBox;
    }
    BoxBorder.prototype.render = function () {
        var top = this.formLine('width:100%;height:2px;top:0px;');
        var bottom = this.formLine('width:100%;height:2px;bottom:0px;');
        var right = this.formLine('width:2px;height:100%;top:0px;right:0px;');
        var left = this.formLine('width:2px;height:100%;top:0px;');
        return dom.addContentTo(this.referenceBox.getId(), top + bottom + right + left);
    };
    BoxBorder.prototype.formLine = function (sizeAndPositionStyle) {
        return '<div style="position:absolute;' + sizeAndPositionStyle + 'background-color:lightskyblue;"></div>';
    };
    return BoxBorder;
}());
exports.BoxBorder = BoxBorder;
//# sourceMappingURL=BoxBorder.js.map