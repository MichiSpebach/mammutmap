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
exports.FileBox = void 0;
var util = require("./util");
var Box_1 = require("./Box");
var FileBox = /** @class */ (function (_super) {
    __extends(FileBox, _super);
    function FileBox(parent, name, id) {
        return _super.call(this, parent, name, id) || this;
    }
    FileBox.prototype.render = function (widthInPercent, heightInPercent) {
        var _this = this;
        _super.prototype.setWidthInPercent.call(this, widthInPercent);
        _super.prototype.setHeightInPercent.call(this, heightInPercent);
        util.readFile(this.getPath(), function (dataConvertedToHtml) {
            _this.renderDiv(dataConvertedToHtml);
        });
    };
    FileBox.prototype.renderDiv = function (content) {
        var basicStyle = 'display:inline-block;overflow:auto;';
        var scaleStyle = 'width:' + _super.prototype.getWidthInPercent.call(this) + '%;height:' + _super.prototype.getHeightInPercent.call(this) + '%;';
        var borderStyle = 'border:solid;border-color:skyblue;';
        util.setStyleTo(_super.prototype.getId.call(this), basicStyle + scaleStyle + borderStyle);
        var nameElement = '<div style="background-color:skyblue;">' + _super.prototype.getName.call(this) + '</div>';
        var contentElement = '<pre style="margin:0px;">' + content + '</pre>';
        util.setContentTo(_super.prototype.getId.call(this), nameElement + contentElement);
    };
    return FileBox;
}(Box_1.Box));
exports.FileBox = FileBox;
//# sourceMappingURL=FileBox.js.map