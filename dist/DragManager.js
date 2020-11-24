"use strict";
exports.__esModule = true;
exports.DragManager = void 0;
var dom = require("./domAdapter");
// TODO: rename to BoxDragManager?
var DragManager = /** @class */ (function () {
    function DragManager() {
    }
    DragManager.setDragOverBox = function (box) {
        if (this.dragOverBox == box) {
            return;
        }
        if (this.dragOverBox != null) {
            this.dragOverBox.setDragOverStyle(false);
        }
        if (box != null) {
            box.setDragOverStyle(true);
        }
        this.dragOverBox = box;
    };
    DragManager.addDraggable = function (elementToDrag) {
        var _this = this;
        var draggableId = elementToDrag.getId(); //elementToDrag.getDraggableId()
        dom.addDragListenerTo(draggableId, 'dragstart', function (clientX, clientY) {
            //dom.removeDragEnterListenerFrom(draggableId)
            elementToDrag.dragStart(clientX, clientY);
            _this.draggingBox = elementToDrag;
        });
        dom.addDragListenerTo(draggableId, 'drag', function (clientX, clientY) { return elementToDrag.drag(clientX, clientY); });
        dom.addDragListenerTo(draggableId, 'dragend', function (clientX, clientY) {
            //dom.addDragEnterListenerTo(draggableId)
            elementToDrag.dragEnd(clientX, clientY);
            _this.draggingBox = null;
            _this.setDragOverBox(null);
        });
    };
    DragManager.addDropTarget = function (targetElement) {
        var _this = this;
        dom.addDragEnterListenerTo(targetElement.getId(), 'dragenter', targetElement.getDraggableId(), function () {
            _this.setDragOverBox(targetElement);
        });
    };
    DragManager.draggingBox = null;
    DragManager.dragOverBox = null;
    return DragManager;
}());
exports.DragManager = DragManager;
//# sourceMappingURL=DragManager.js.map