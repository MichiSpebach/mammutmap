"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileBoxHeader = void 0;
const styleAdapter_1 = require("../../styleAdapter");
const BoxHeader_1 = require("./BoxHeader");
class FileBoxHeader extends BoxHeader_1.BoxHeader {
    constructor(referenceBox) {
        super(referenceBox);
    }
    getInnerStyleClassNames() {
        const classNames = super.getInnerStyleClassNames();
        classNames.push(styleAdapter_1.style.getFileBoxHeaderInnerClass());
        return classNames;
    }
}
exports.FileBoxHeader = FileBoxHeader;
