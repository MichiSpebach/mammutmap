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
        var top = '<rect width="100%" height="2px" style="fill:skyblue;"/>';
        var bottom = '<rect width="100%" height="2px" alignment-baseline="middle" style="fill:skyblue;"/>';
        var right = '<rect width="2px" height="100%" alignment-baseline="middle" style="fill:skyblue;"/>';
        var left = '<rect width="2px" height="100%" style="fill:skyblue;"/>';
        var style = 'position:absolute;width:100%;height:100%;pointer-events: none;';
        return dom.addContentTo(this.referenceBox.getId(), '<svg style="' + style + '">' + top + bottom + right + left + '</svg>');
    };
    return BoxBorder;
}());
exports.BoxBorder = BoxBorder;
//# sourceMappingURL=BoxBorder.js.map