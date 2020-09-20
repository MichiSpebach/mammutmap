"use strict";
exports.__esModule = true;
exports.FileBox = void 0;
var util = require("./util");
var FileBox = /** @class */ (function () {
    function FileBox(parent, name, id, widthInPercent, heightInPercent) {
        this.parent = parent;
        this.name = name;
        this.id = id;
        this.widthInPercent = widthInPercent;
        this.heightInPercent = heightInPercent;
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
        var basicStyle = 'display:inline-block;overflow:auto;';
        var scaleStyle = 'width:' + this.widthInPercent + '%;height:' + this.heightInPercent + '%;';
        var borderStyle = 'border:solid;border-color:skyblue;';
        util.setStyleTo(this.id, basicStyle + scaleStyle + borderStyle);
        var nameElement = '<div style="background-color:skyblue;">' + this.name + '</div>';
        var contentElement = '<pre style="margin:0px;">' + content + '</pre>';
        util.setContentTo(this.id, nameElement + contentElement);
    };
    return FileBox;
}());
exports.FileBox = FileBox;
//# sourceMappingURL=FileBox.js.map