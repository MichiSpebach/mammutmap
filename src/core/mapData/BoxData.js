"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxData = void 0;
const LocalRect_1 = require("../LocalRect");
const JsonObject_1 = require("../JsonObject");
const util_1 = require("../util/util");
const LinkData_1 = require("./LinkData");
const LocalPosition_1 = require("../shape/LocalPosition");
const NodeData_1 = require("./NodeData");
class BoxData extends JsonObject_1.JsonObject {
    static buildNewFromRect(rect) {
        return this.buildNew(rect.x, rect.y, rect.width, rect.height);
    }
    static buildNew(x, y, width, height) {
        return this.buildNewWithId(util_1.util.generateId(), x, y, width, height);
    }
    static buildNewWithId(id, x, y, width, height) {
        return new BoxData(id, x, y, width, height, [], []);
    }
    static buildFromJson(json) {
        return this.ofRawObject(JSON.parse(json)); // parsed object has no functions
    }
    static ofRawObject(object) {
        const boxData = Object.setPrototypeOf(object, BoxData.prototype);
        if (!boxData.links) {
            boxData.links = [];
        }
        else {
            boxData.links = boxData.links.map(LinkData_1.LinkData.buildFromRawObject); // raw object would have no methods
        }
        if (!boxData.nodes) {
            boxData.nodes = [];
        }
        else {
            boxData.nodes = boxData.nodes.map(NodeData_1.NodeData.buildFromRawObject); // raw object would have no methods
        }
        boxData.validate();
        return boxData;
    }
    constructor(id, x, y, width, height, links, nodes) {
        super();
        this.id = id;
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.links = links;
        this.nodes = nodes;
        this.validate();
    }
    validate() {
        this.warnIf(this.id == null, 'id is null');
        this.warnIf(this.id == undefined, 'id is undefined');
        this.warnIf(this.id == '', 'id is empty');
        this.warnIf(this.x == null, 'x is null');
        this.warnIf(this.y == null, 'y is null');
        this.warnIf(this.width == null, 'width is null');
        this.warnIf(this.height == null, 'height is null');
        this.warnIf(this.x == undefined, 'x is undefined');
        this.warnIf(this.y == undefined, 'y is undefined');
        this.warnIf(this.width == undefined, 'width is undefined');
        this.warnIf(this.height == undefined, 'height is undefined');
        this.warnIf(this.width <= 0, 'width is not positive');
        this.warnIf(this.height <= 0, 'height is not positive');
    }
    warnIf(condition, message) {
        if (condition) {
            this.warn(message);
        }
    }
    warn(message) {
        util_1.util.logWarning('BoxData with id ' + this.id + ': ' + message);
    }
    roundFieldsForSave() {
        // TODO: only round fields that have been modified, to avoid spamming changes into map files
        this.x = this.roundPercentForSave(this.x);
        this.y = this.roundPercentForSave(this.y);
        this.width = this.roundPercentForSave(this.width);
        this.height = this.roundPercentForSave(this.height);
        //this.links.roundFieldsForSave() TODO: but overblending when zooming could become visible
        //this.nodes.roundFieldsForSave() TODO
    }
    roundPercentForSave(percentValue) {
        return Math.round(percentValue * 1000) / 1000;
    }
    toJson() {
        return util_1.util.toFormattedJson(this);
    }
    getTopLeftPosition() {
        return new LocalPosition_1.LocalPosition(this.x, this.y);
    }
    getBottomRightPosition() {
        return new LocalPosition_1.LocalPosition(this.x + this.width, this.y + this.height);
    }
    getRect() {
        return new LocalRect_1.LocalRect(this.x, this.y, this.width, this.height);
    }
    getRawField(name) {
        return this[name];
    }
    setRawField(name, value) {
        this[name] = value;
    }
}
exports.BoxData = BoxData;
