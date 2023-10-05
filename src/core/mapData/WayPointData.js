"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WayPointData = void 0;
const util_1 = require("../util/util");
const LocalPosition_1 = require("../shape/LocalPosition");
class WayPointData {
    static buildNew(boxId, boxName, x, y) {
        return new WayPointData(boxId, boxName, Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000);
    }
    static buildFromRawObject(object) {
        const wayPointData = Object.setPrototypeOf(object, WayPointData.prototype); // raw object would have no methods
        wayPointData.validate();
        return wayPointData;
    }
    constructor(boxId, boxName, x, y) {
        this.boxId = boxId;
        this.boxName = boxName;
        this.x = x;
        this.y = y;
        this.validate();
    }
    validate() {
        if (!this.boxId || this.boxId.length === 0) {
            util_1.util.logWarning('WayPointData::boxId is undefined or null or has length 0.');
        }
        if (!this.boxName || this.boxName.length === 0) {
            util_1.util.logWarning('WayPointData::boxName is undefined or null or has length 0.');
        }
        if (this.x === undefined || this.x === null) {
            util_1.util.logWarning('WayPointData::x is undefined or null.');
        }
        else if (this.x < 0 || this.x > 100) {
            // TODO: sometimes there is a difference of epsilon, reactivate as soon as values are rounded before save
            //util.logWarning(`expected WayPointData::x to be between 0 and 100 but it is ${this.x}.`)
        }
        if (this.y === undefined || this.y === null) {
            util_1.util.logWarning('WayPointData::y is undefined or null.');
        }
        else if (this.y < 0 || this.y > 100) {
            // TODO: sometimes there is a difference of epsilon, reactivate as soon as values are rounded before save
            //util.logWarning(`expected WayPointData::y to be between 0 and 100 but it is ${this.y}.`)
        }
    }
    getPosition() {
        return new LocalPosition_1.LocalPosition(this.x, this.y);
    }
}
exports.WayPointData = WayPointData;
