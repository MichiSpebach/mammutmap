"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LinkData = void 0;
const LinkEndData_1 = require("./LinkEndData");
class LinkData {
    static buildFromRawObject(object) {
        let from;
        let to;
        if (object.from) {
            from = LinkEndData_1.LinkEndData.buildFromRawObject(object.from); // raw object would have no methods
        }
        else {
            // backwards compatibility, old files have wayPoints array field instead
            from = LinkEndData_1.LinkEndData.buildFromRawObject(new LinkEndData_1.LinkEndData(object.fromWayPoints)); // raw object would have no methods
        }
        if (object.to) {
            to = LinkEndData_1.LinkEndData.buildFromRawObject(object.to); // raw object would have no methods
        }
        else {
            // backwards compatibility, old files have wayPoints array field instead
            to = LinkEndData_1.LinkEndData.buildFromRawObject(new LinkEndData_1.LinkEndData(object.toWayPoints)); // raw object would have no methods
        }
        return new LinkData(object.id, from, to, object.tags);
    }
    constructor(id, from, to, tags) {
        this.id = id;
        this.from = from;
        this.to = to;
        this.tags = tags;
    }
}
exports.LinkData = LinkData;
