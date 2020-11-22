"use strict";
exports.__esModule = true;
exports.DragManager = void 0;
var util = require("./util");
var dom = require("./domAdapter");
// TODO: rename to BoxDragManager?
var DragManager = /** @class */ (function () {
    function DragManager() {
    }
    DragManager.addDraggable = function (elementToDrag) {
        var _this = this;
        var draggableId = elementToDrag.getId(); //elementToDrag.getDraggableId()
        dom.addDragListenerTo(draggableId, 'dragstart', function (clientX, clientY) {
            //dom.removeDragEnterListenerFrom(draggableId)
            elementToDrag.dragStart(clientX, clientY);
            _this.draggingBox = elementToDrag;
        });
        //dom.addDragListenerTo(draggableId, 'drag', (clientX: number, clientY: number) => elementToDrag.drag(clientX, clientY))
        dom.addDragListenerTo(draggableId, 'dragend', function (_) {
            //dom.addDragEnterListenerTo(draggableId)
            elementToDrag.dragend();
            _this.draggingBox = null;
            _this.dragOverBox = null;
        });
    };
    DragManager.addDropTarget = function (targetElement) {
        var _this = this;
        dom.addDragEnterListenerTo(targetElement.getId(), 'dragenter', targetElement.getDraggableId(), function () {
            if (_this.dragOverBox == targetElement) {
                return;
            }
            util.logInfo('addDropTarget ' + targetElement.getId());
            if (_this.dragOverBox != null) {
                _this.dragOverBox.setDragOverStyle(false);
            }
            _this.dragOverBox = targetElement;
            _this.dragOverBox.setDragOverStyle(true);
        });
    };
    DragManager.draggingBox = null;
    DragManager.dragOverBox = null;
    return DragManager;
}());
exports.DragManager = DragManager;
//# sourceMappingURL=DragManager.js.map