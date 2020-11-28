"use strict";
exports.__esModule = true;
exports.DragManager = void 0;
var util = require("./util");
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
            elementToDrag.dragStart(clientX, clientY);
            _this.draggingBox = elementToDrag;
        });
        dom.addDragListenerTo(draggableId, 'drag', function (clientX, clientY) { return elementToDrag.drag(clientX, clientY); });
        dom.addDragListenerTo(draggableId, 'dragend', function (clientX, clientY) {
            if (_this.dragOverBox == null) {
                util.logWarning("DragManager: dragOverBox is null although dragging was in progress");
                elementToDrag.dragCancel();
                return;
            }
            // TODO: call elementToDrag.dragCancel() if esc is pressed
            elementToDrag.dragEnd(clientX, clientY, _this.dragOverBox);
            _this.draggingBox = null;
            _this.setDragOverBox(null);
        });
    };
    DragManager.addDropTarget = function (targetElement) {
        var _this = this;
        dom.addDragListenerTo(targetElement.getId(), 'dragenter', function (_) { return _this.setDragOverBox(targetElement); });
    };
    DragManager.draggingBox = null;
    DragManager.dragOverBox = null;
    return DragManager;
}());
exports.DragManager = DragManager;
//# sourceMappingURL=DragManager.js.map