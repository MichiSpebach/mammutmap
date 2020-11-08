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
exports.RootDirectoryBox = void 0;
var DirectoryBox_1 = require("./DirectoryBox");
var RootDirectoryBox = /** @class */ (function (_super) {
    __extends(RootDirectoryBox, _super);
    function RootDirectoryBox(path, id) {
        return _super.call(this, path, id, null) || this;
    }
    return RootDirectoryBox;
}(DirectoryBox_1.DirectoryBox));
exports.RootDirectoryBox = RootDirectoryBox;
//# sourceMappingURL=RootDirectoryBox.js.map