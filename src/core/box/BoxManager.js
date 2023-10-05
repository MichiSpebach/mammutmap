"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.boxManager = exports.BoxManager = void 0;
const util_1 = require("../util/util");
class BoxManager {
    constructor() {
        this.boxes = new Map();
    }
    getNumberOfBoxes() {
        return this.boxes.size;
    }
    addBox(box) {
        if (this.boxes.has(box.getId())) {
            util_1.util.logWarning('trying to add box with id ' + box.getId() + ' that is already contained by BoxManager.');
        }
        this.boxes.set(box.getId(), box);
    }
    removeBox(box) {
        if (!this.boxes.has(box.getId())) {
            util_1.util.logWarning('trying to remove box with id ' + box.getId() + ' that is not contained by BoxManager.');
        }
        this.boxes.delete(box.getId());
    }
    getBox(id) {
        const box = this.boxes.get(id);
        if (box === undefined) {
            util_1.util.logError('box with id ' + id + ' does not exist or is not registered in BoxManager.');
        }
        return box;
    }
    getBoxIfExists(id) {
        return this.boxes.get(id);
    }
}
exports.BoxManager = BoxManager;
exports.boxManager = new BoxManager();
function init(object) {
    exports.boxManager = object;
}
exports.init = init;
