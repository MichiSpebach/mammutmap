"use strict";
exports.__esModule = true;
exports.Box = void 0;
var util = require("./util");
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
    Box.prototype.getPath = function () {
        if (this.parent == null) {
            return this.name;
        }
        return this.parent.getPath() + '/' + this.name;
    };
    Box.prototype.render = function (widthInPercent, heightInPercent) {
        this.widthInPercent = widthInPercent;
        this.heightInPercent = heightInPercent;
        this.renderStyle();
        this.renderHeader();
        this.renderBody();
    };
    Box.prototype.renderStyle = function () {
        var basicStyle = 'display:inline-block;overflow:auto;';
        var scaleStyle = 'width:' + this.widthInPercent + '%;height:' + this.heightInPercent + '%;';
        var borderStyle = this.getBorderStyle();
        util.setStyleTo(this.getId(), basicStyle + scaleStyle + borderStyle);
    };
    Box.prototype.renderHeader = function () {
        var headerElement = '<div style="background-color:skyblue;">' + this.name + '</div>';
        util.setContentTo(this.getId(), headerElement);
    };
    return Box;
}());
exports.Box = Box;
//# sourceMappingURL=Box.js.map