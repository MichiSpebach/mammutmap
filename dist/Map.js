"use strict";
exports.__esModule = true;
exports.Map = void 0;
var util = require("./util");
var DirectoryBox_1 = require("./DirectoryBox");
var Map = /** @class */ (function () {
    function Map() {
        var _this = this;
        this.scalePercent = 100;
        util.setContent('<div id="map" style="overflow:hidden; width:100%; height:100%"></div>');
        util.setContentTo('map', '<div id="mapRatioAdjuster"></div>');
        util.setContentTo('mapRatioAdjuster', '<div id="root"></div>');
        this.updateStyle();
        this.rootDirectory = new DirectoryBox_1.DirectoryBox(null, './src', 'root');
        this.rootDirectory.render(99, 99);
        util.addWheelListenerTo('map', function (delta) { return _this.zoom(delta); });
    }
    Map.prototype.zoom = function (delta) {
        this.scalePercent -= this.scalePercent * (delta / 1000);
        util.logInfo('zoom: ' + this.scalePercent);
        this.updateStyle();
    };
    Map.prototype.updateStyle = function () {
        util.setStyleTo('mapRatioAdjuster', 'width:' + this.scalePercent + '%;height:' + this.scalePercent + '%;');
    };
    return Map;
}());
exports.Map = Map;
//# sourceMappingURL=Map.js.map