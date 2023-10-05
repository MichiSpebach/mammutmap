"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonObject = void 0;
const util_1 = require("./util/util");
class JsonObject {
    toJson() {
        return util_1.util.toFormattedJson(this);
    }
    mergeIntoJson(jsonToMergeInto) {
        // TODO: improve, jsonToMergeInto should only be changed where needed (not completely reformatted)
        const objectToMergeInto = JSON.parse(jsonToMergeInto);
        const mergedObject = { ...objectToMergeInto, ...this };
        const mergedJson = util_1.util.toFormattedJson(mergedObject);
        return mergedJson;
    }
}
exports.JsonObject = JsonObject;
