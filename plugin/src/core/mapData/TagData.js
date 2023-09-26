"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagData = void 0;
const JsonObject_1 = require("../JsonObject");
class TagData extends JsonObject_1.JsonObject {
    constructor(name, count) {
        super();
        this.name = name;
        this.count = count;
    }
}
exports.TagData = TagData;
