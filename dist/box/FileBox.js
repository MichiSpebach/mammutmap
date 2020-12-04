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
exports.FileBox = void 0;
var util = require("../util");
var dom = require("../domAdapter");
var Box_1 = require("./Box");
var FileBox = /** @class */ (function (_super) {
    __extends(FileBox, _super);
    function FileBox(path, id, parent) {
        return _super.call(this, path, id, parent) || this;
    }
    FileBox.prototype.getOverflow = function () {
        return 'hidden';
    };
    FileBox.prototype.getAdditionalStyle = function () {
        return null;
    };
    FileBox.prototype.renderBody = function () {
        var _this = this;
        util.readFileAndConvertToHtml(_super.prototype.getPath.call(this).getSrcPath(), function (dataConvertedToHtml) {
            var content = '<pre style="margin:0px;">' + dataConvertedToHtml + '</pre>';
            dom.addContentTo(_super.prototype.getId.call(_this), content);
        });
    };
    return FileBox;
}(Box_1.Box));
exports.FileBox = FileBox;
//# sourceMappingURL=FileBox.js.map