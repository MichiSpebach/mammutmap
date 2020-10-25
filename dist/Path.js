"use strict";
exports.__esModule = true;
exports.Path = void 0;
var Path = /** @class */ (function () {
    function Path(parent, srcName, mapName) {
        this.parent = parent;
        this.srcName = srcName;
        this.mapName = mapName;
    }
    Path.buildRoot = function (srcName, mapName) {
        return new Path(null, srcName, mapName);
    };
    Path.buildDirEntry = function (parent, name) {
        return new Path(parent, name, name);
    };
    Path.prototype.isRoot = function () {
        return this.parent == null;
    };
    Path.prototype.getSrcName = function () {
        return this.srcName;
    };
    Path.prototype.getSrcPath = function () {
        var _this = this;
        return this.getPath(this.srcName, function () { return _this.parent.getSrcPath(); });
    };
    Path.prototype.getMapPath = function () {
        var _this = this;
        return this.getPath(this.mapName, function () { return _this.parent.getMapPath(); });
    };
    Path.prototype.getPath = function (name, getParentPath) {
        if (this.parent == null) {
            return name;
        }
        return getParentPath() + '/' + name;
    };
    return Path;
}());
exports.Path = Path;
//# sourceMappingURL=Path.js.map