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
var Box = /** @class */ (function () {
    function Box(path, id, parent) {
        this.mapData = BoxMapData_1.BoxMapData.buildDefault();
        this.dragOffset = { x: 0, y: 0 };
        this.path = path;
        this.id = id;
        this.parent = parent;
    }
    Box.prototype.getPath = function () {
        return this.path;
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
        this.renderBody();
    };
    Box.prototype.loadAndProcessMapData = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!!this.getPath().isRoot()) return [3 /*break*/, 2];
                        return [4 /*yield*/, util.readFile(this.getPath().getMapPath() + '.json')
                                .then(function (json) { return _this.mapData = BoxMapData_1.BoxMapData.buildFromJson(json); })["catch"](function (error) { return util.logWarning('failed to load ' + _this.getPath().getMapPath() + '.json: ' + error); })];
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
    Box.prototype.renderStyle = function () {
        var basicStyle = 'display:inline-block;position:absolute;overflow:' + this.getOverflow() + ';';
        var scaleStyle = 'width:' + this.mapData.width + '%;height:' + this.mapData.height + '%;';
        var positionStyle = 'left:' + this.mapData.x + '%;top:' + this.mapData.y + '%;';
        var borderStyle = this.getBorderStyle();
        return dom.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle + borderStyle);
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
                        return [2 /*return*/];
                }
            });
        });
    };
    Box.prototype.drag = function (clientX, clientY) {
        return __awaiter(this, void 0, void 0, function () {
            var parentClientRect;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getParent().getClientRect()
                        /*if (!parentClientRect.isPositionInside(clientX, clientY)) {
                          await this.moveOut()
                          this.drag(clientX, clientY)
                          return
                        }
                        let boxesAtPostion = await this.getParent().getBoxesAt(clientX, clientY)
                        let boxToMoveInside: DirectoryBox|null = null
                        for (let i:number = 0; i < boxesAtPostion.length; i++) {
                          let box = boxesAtPostion[i]
                          if (box != this && box instanceof DirectoryBox) {
                            boxToMoveInside = box
                            break
                          }
                        }
                        if (boxToMoveInside != null) {
                          boxToMoveInside.addBox(this)
                          boxToMoveInside.setDragOverStyle(true)
                          this.getParent().removeBox(this)
                          this.getParent().setDragOverStyle(false)
                    
                          this.parent = boxToMoveInside
                          this.renderStyle()
                          return
                        }*/
                    ]; // TODO: cache for better responsivity, as long as dragging is in progress
                    case 1:
                        parentClientRect = _a.sent() // TODO: cache for better responsivity, as long as dragging is in progress
                        ;
                        /*if (!parentClientRect.isPositionInside(clientX, clientY)) {
                          await this.moveOut()
                          this.drag(clientX, clientY)
                          return
                        }
                        let boxesAtPostion = await this.getParent().getBoxesAt(clientX, clientY)
                        let boxToMoveInside: DirectoryBox|null = null
                        for (let i:number = 0; i < boxesAtPostion.length; i++) {
                          let box = boxesAtPostion[i]
                          if (box != this && box instanceof DirectoryBox) {
                            boxToMoveInside = box
                            break
                          }
                        }
                        if (boxToMoveInside != null) {
                          boxToMoveInside.addBox(this)
                          boxToMoveInside.setDragOverStyle(true)
                          this.getParent().removeBox(this)
                          this.getParent().setDragOverStyle(false)
                    
                          this.parent = boxToMoveInside
                          this.renderStyle()
                          return
                        }*/
                        this.mapData.x = (clientX - parentClientRect.x - this.dragOffset.x) / parentClientRect.width * 100;
                        this.mapData.y = (clientY - parentClientRect.y - this.dragOffset.y) / parentClientRect.height * 100;
                        this.renderStyle();
                        return [2 /*return*/];
                }
            });
        });
    };
    Box.prototype.dragend = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    Box.prototype.moveOut = function () {
        return __awaiter(this, void 0, void 0, function () {
            var oldParent, newParent, oldParentClientRectPromise, newParentClientRectPromise, oldParentClientRect, newParentClientRect;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        oldParent = this.getParent();
                        newParent = oldParent.getParent();
                        oldParentClientRectPromise = oldParent.getClientRect();
                        newParentClientRectPromise = newParent.getClientRect();
                        return [4 /*yield*/, oldParentClientRectPromise];
                    case 1:
                        oldParentClientRect = _a.sent();
                        return [4 /*yield*/, newParentClientRectPromise];
                    case 2:
                        newParentClientRect = _a.sent();
                        this.mapData.width *= oldParentClientRect.width / newParentClientRect.width;
                        this.mapData.height *= oldParentClientRect.height / newParentClientRect.height;
                        newParent.addBox(this);
                        newParent.setDragOverStyle(true);
                        oldParent.removeBox(this);
                        oldParent.setDragOverStyle(false);
                        this.parent = newParent;
                        this.renderStyle(); // TODO: add await to prevent flickering
                        return [2 /*return*/];
                }
            });
        });
    };
    return Box;
}());
exports.Box = Box;
//# sourceMappingURL=Box.js.map