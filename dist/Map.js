"use strict";
exports.__esModule = true;
exports.Map = void 0;
var util = require("./util");
var DirectoryBox_1 = require("./DirectoryBox");
var Map = /** @class */ (function () {
    function Map() {
        util.setContent('<div id="map""></div>');
        this.rootDirectory = new DirectoryBox_1.DirectoryBox(null, './src', 'map');
        this.rootDirectory.render(99, 99);
        util.addWheelListenerTo('map', this.zoom);
    }
    Map.prototype.zoom = function (delta) {
        util.logInfo("zooming " + delta);
    };
    return Map;
}());
exports.Map = Map;
//# sourceMappingURL=Map.js.map