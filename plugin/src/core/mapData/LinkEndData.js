"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkEndData = void 0;
const WayPointData_1 = require("./WayPointData");
class LinkEndData {
    static buildFromRawObject(object) {
        const path = object.path.map(WayPointData_1.WayPointData.buildFromRawObject); // raw path objects would have no methods
        return new LinkEndData(path, object.floatToBorder);
    }
    constructor(path, floatToBorder) {
        this.path = path;
        this.floatToBorder = floatToBorder;
    }
}
exports.LinkEndData = LinkEndData;
