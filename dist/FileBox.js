"use strict";
exports.__esModule = true;
exports.FileBox = void 0;
var util = require("./util");
var FileBox = /** @class */ (function () {
    function FileBox(parent, name, id) {
        this.parent = parent;
        this.name = name;
        this.id = id;
    }
    FileBox.prototype.getPath = function () {
        return this.parent.getPath() + '/' + this.name;
    };
    FileBox.prototype.render = function () {
        var _this = this;
        util.readFile(this.getPath(), function (dataConvertedToHtml) {
            _this.renderDiv(dataConvertedToHtml);
        });
    };
    FileBox.prototype.renderDiv = function (content) {
        var preformattedContent = '<pre style="margin:0px">' + content + '</pre>';
        var contentDivision = '<div style="border:solid;border-color:skyblue">' + preformattedContent + '</div>';
        util.setContentTo(this.id, this.name + contentDivision);
    };
    return FileBox;
}());
exports.FileBox = FileBox;
//# sourceMappingURL=FileBox.js.map