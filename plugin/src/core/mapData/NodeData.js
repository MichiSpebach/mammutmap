"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NodeData = void 0;
const util_1 = require("../util/util");
const JsonObject_1 = require("../JsonObject");
const LocalPosition_1 = require("../shape/LocalPosition");
class NodeData extends JsonObject_1.JsonObject {
    static buildNew(x, y) {
        return new NodeData(util_1.util.generateId(), x, y);
    }
    static buildFromRawObject(object) {
        const nodeData = Object.setPrototypeOf(object, NodeData.prototype); // raw object would have no methods
        nodeData.validate();
        return nodeData;
    }
    constructor(id, x, y) {
        super();
        this.id = id;
        this.x = x;
        this.y = y;
        this.validate();
    }
    validate() {
        if (!this.id || this.id.length === 0) {
            util_1.util.logWarning('NodeData::id is undefined or null or has length 0.');
        }
        if (this.x === undefined || this.x === null) {
            util_1.util.logWarning('NodeData::x is undefined or null.');
        }
        else if (this.x < 0 || this.x > 100) {
            // TODO: sometimes there is a difference of epsilon, reactivate as soon as values are rounded before save
            //util.logWarning(`expected NodeData::x to be between 0 and 100 but it is ${this.x}.`)
        }
        if (this.y === undefined || this.y === null) {
            util_1.util.logWarning('NodeData::y is undefined or null.');
        }
        else if (this.y < 0 || this.y > 100) {
            // TODO: sometimes there is a difference of epsilon, reactivate as soon as values are rounded before save
            //util.logWarning(`expected NodeData::y to be between 0 and 100 but it is ${this.y}.`)
        }
    }
    getPosition() {
        return new LocalPosition_1.LocalPosition(this.x, this.y);
    }
    setPosition(position) {
        this.x = position.percentX;
        this.y = position.percentY;
    }
}
exports.NodeData = NodeData;
