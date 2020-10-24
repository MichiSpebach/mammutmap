"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
exports.__esModule = true;
exports.Map = void 0;
var util = require("./util");
var Path_1 = require("./Path");
var DirectoryBox_1 = require("./DirectoryBox");
var Map = /** @class */ (function () {
    function Map() {
        var _this = this;
        this.scalePercent = 100;
        this.marginTopPercent = 0;
        this.marginLeftPercent = 0;
        this.mapRatioAdjusterSizePx = 500;
        util.setContent('<div id="map" style="overflow:hidden; width:100%; height:100%;"></div>');
        util.setContentTo('map', '<div id="mapRatioAdjuster" style="width:' + this.mapRatioAdjusterSizePx + 'px; height:' + this.mapRatioAdjusterSizePx + 'px;"></div>');
        util.setContentTo('mapRatioAdjuster', '<div id="mapMover" style="width:100%; height:100%;"></div>');
        util.setContentTo('mapMover', '<div id="root" style="width:100%; height:100%;"></div>');
        this.updateStyle();
        //this.addBoxes()
        var rootPath = Path_1.Path.buildRoot('./src', './map');
        this.rootDirectory = new DirectoryBox_1.DirectoryBox(rootPath, 'root');
        this.rootDirectory.render(99, 99);
        util.addWheelListenerTo('map', function (delta, clientX, clientY) { return _this.zoom(-delta, clientX, clientY); });
    }
    Map.prototype.addBoxes = function () {
        this.addBox('green');
        this.addBox('blue');
        this.addBox('green');
        this.addBox('blue');
        this.addBox('blue');
        this.addBox('green');
        this.addBox('blue');
        this.addBox('green');
        this.addBox('green');
        this.addBox('blue');
        this.addBox('green');
        this.addBox('blue');
        this.addBox('blue');
        this.addBox('green');
        this.addBox('blue');
        this.addBox('green');
    };
    Map.prototype.addBox = function (color) {
        util.addContentTo('root', '<div style="display:inline-block;width:25%;height:25%;margin:0px;padding:0px;background-color:' + color + ';"><div>');
    };
    Map.prototype.zoom = function (delta, clientX, clientY) {
        var clientYPercent = 100 * clientY / this.mapRatioAdjusterSizePx;
        var clientXPercent = 100 * clientX / this.mapRatioAdjusterSizePx;
        var scaleChange = this.scalePercent * (delta / 500);
        this.marginTopPercent -= scaleChange * (clientYPercent - this.marginTopPercent) / this.scalePercent;
        this.marginLeftPercent -= scaleChange * (clientXPercent - this.marginLeftPercent) / this.scalePercent;
        this.scalePercent += scaleChange;
        this.updateStyle();
    };
    Map.prototype.updateStyle = function () {
        return __awaiter(this, void 0, void 0, function () {
            var offsetStyle, scaleStyle;
            return __generator(this, function (_a) {
                offsetStyle = 'margin-top:' + this.marginTopPercent + '%;margin-left:' + this.marginLeftPercent + '%;';
                scaleStyle = 'width:' + this.scalePercent + '%;height:' + this.scalePercent + '%;';
                util.setStyleTo('mapMover', offsetStyle + scaleStyle);
                return [2 /*return*/];
            });
        });
    };
    return Map;
}());
exports.Map = Map;
//# sourceMappingURL=Map.js.map