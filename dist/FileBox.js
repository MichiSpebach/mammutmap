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
        _super.prototype.setWidthInPercent.call(this, widthInPercent);
        _super.prototype.setHeightInPercent.call(this, heightInPercent);
        this.renderStyle();
        _super.prototype.renderHeader.call(this);
        this.renderBody();
    };
    FileBox.prototype.renderStyle = function () {
        var basicStyle = 'display:inline-block;overflow:auto;';
        var scaleStyle = 'width:' + _super.prototype.getWidthInPercent.call(this) + '%;height:' + _super.prototype.getHeightInPercent.call(this) + '%;';
        var borderStyle = 'border:solid;border-color:skyblue;';
        util.setStyleTo(_super.prototype.getId.call(this), basicStyle + scaleStyle + borderStyle);
    };
    FileBox.prototype.renderBody = function () {
        var _this = this;
        util.readFile(this.getPath(), function (dataConvertedToHtml) {
            var content = '<pre style="margin:0px;">' + dataConvertedToHtml + '</pre>';
            util.addContentTo(_super.prototype.getId.call(_this), content);
        });
    };
    return FileBox;
}(Box_1.Box));
exports.FileBox = FileBox;
//# sourceMappingURL=FileBox.js.map