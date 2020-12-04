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
exports.Box = void 0;
var util = require("../util");
var dom = require("../domAdapter");
var BoxMapData_1 = require("./BoxMapData");
var DragManager_1 = require("../DragManager");
var BoxBorder_1 = require("./BoxBorder");
var Box = /** @class */ (function () {
    function Box(path, id, parent) {
        this.mapData = BoxMapData_1.BoxMapData.buildDefault();
        this.unsavedChanges = false;
        this.dragOffset = { x: 0, y: 0 }; // TODO: move into DragManager and let DragManager return calculated position of box (instead of pointer)
        this.hide = false; // TODO: don't hide, use pointer-events: none; in style instead
        this.border = new BoxBorder_1.BoxBorder(this);
        this.path = path;
        this.id = id;
        this.parent = parent;
    }
    Box.prototype.getPath = function () {
        return this.path;
    };
    Box.prototype.getMapDataFilePath = function () {
        return this.getPath().getMapPath() + '.json';
    };
    Box.prototype.getId = function () {
        return this.id;
    };
    Box.prototype.getHeaderId = function () {
        return this.getId() + 'header';
    };
    Box.prototype.getParent = function () {
        if (this.parent == null) {
            util.logError('Box.getParent() cannot be called on root.');
        }
        return this.parent;
    };
    Box.prototype.getClientRect = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, dom.getClientRectOf(this.getId())];
                    case 1: 
                    // TODO: cache rect for better responsivity?
                    // TODO: but then more complex, needs to be updated on many changes, also when parent boxes change
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    Box.prototype.render = function () {
        this.loadAndProcessMapData();
        this.renderHeader();
        this.border.render();
        this.renderBody();
    };
    Box.prototype.loadAndProcessMapData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.getPath().isRoot()) return [3 /*break*/, 2];
                        return [4 /*yield*/, util.readFile(this.getMapDataFilePath())
                                .then(function (json) { return _this.mapData = BoxMapData_1.BoxMapData.buildFromJson(json); })["catch"](function (error) { return util.logWarning('failed to load ' + _this.getMapDataFilePath() + ': ' + error); })];
                    case 1:
                        _a.sent();
                        _a.label = 2;
                    case 2: return [4 /*yield*/, this.renderStyle()];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Box.prototype.saveMapData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var mapDataFilePath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mapDataFilePath = this.getMapDataFilePath();
                        return [4 /*yield*/, util.writeFile(mapDataFilePath, this.mapData.toJson())
                                .then(function () { return util.logInfo('saved ' + mapDataFilePath); })["catch"](function (error) { return util.logWarning('failed to save ' + mapDataFilePath + ': ' + error); })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Box.prototype.renderStyle = function () {
        var basicStyle = this.getDisplayStyle() + 'position:absolute;overflow:' + this.getOverflow() + ';';
        var scaleStyle = 'width:' + this.mapData.width + '%;height:' + this.mapData.height + '%;';
        var positionStyle = 'left:' + this.mapData.x + '%;top:' + this.mapData.y + '%;';
        return dom.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle + this.getAdditionalStyle());
    };
    Box.prototype.getDisplayStyle = function () {
        if (this.hide) {
            return 'display:none;';
        }
        else {
            return 'display:inline-block;';
        }
    };
    Box.prototype.renderHeader = function () {
        return __awaiter(this, void 0, void 0, function () {
            var headerElement;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        headerElement = '<div id="' + this.getHeaderId() + '" style="background-color:skyblue;">' + this.getPath().getSrcName() + '</div>';
                        return [4 /*yield*/, dom.setContentTo(this.getId(), headerElement)];
                    case 1:
                        _a.sent();
                        DragManager_1.DragManager.addDraggable(this); // TODO: move to other method
                        return [2 /*return*/];
                }
            });
        });
    };
    Box.prototype.getDraggableId = function () {
        return this.getHeaderId();
    };
    Box.prototype.dragStart = function (clientX, clientY) {
        return __awaiter(this, void 0, void 0, function () {
            var clientRect;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getClientRect()];
                    case 1:
                        clientRect = _a.sent();
                        this.dragOffset = { x: clientX - clientRect.x, y: clientY - clientRect.y };
                        this.hide = true;
                        this.renderStyle();
                        return [2 /*return*/];
                }
            });
        });
    };
    Box.prototype.drag = function (clientX, clientY) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    Box.prototype.dragCancel = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.hide = false;
                this.renderStyle();
                return [2 /*return*/];
            });
        });
    };
    Box.prototype.dragEnd = function (clientX, clientY, dropTarget) {
        return __awaiter(this, void 0, void 0, function () {
            var parent, parentClientRect, oldParent, oldParentClientRect;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        parent = this.getParent();
                        return [4 /*yield*/, parent.getClientRect()];
                    case 1:
                        parentClientRect = _a.sent();
                        if (!(parent != dropTarget)) return [3 /*break*/, 3];
                        oldParent = parent;
                        oldParentClientRect = parentClientRect;
                        parent = dropTarget;
                        this.parent = dropTarget;
                        return [4 /*yield*/, parent.getClientRect()];
                    case 2:
                        parentClientRect = _a.sent();
                        oldParent.removeBox(this);
                        parent.addBox(this);
                        this.mapData.width *= oldParentClientRect.width / parentClientRect.width;
                        this.mapData.height *= oldParentClientRect.height / parentClientRect.height;
                        _a.label = 3;
                    case 3:
                        this.mapData.x = (clientX - parentClientRect.x - this.dragOffset.x) / parentClientRect.width * 100;
                        this.mapData.y = (clientY - parentClientRect.y - this.dragOffset.y) / parentClientRect.height * 100;
                        this.hide = false;
                        this.renderStyle();
                        this.saveMapData();
                        return [2 /*return*/];
                }
            });
        });
    };
    return Box;
}());
exports.Box = Box;
//# sourceMappingURL=Box.js.map