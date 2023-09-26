"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FolderBoxHeader = void 0;
const styleAdapter_1 = require("../../styleAdapter");
const BoxHeader_1 = require("./BoxHeader");
class FolderBoxHeader extends BoxHeader_1.BoxHeader {
    constructor(referenceBox) {
        super(referenceBox);
    }
    getInnerStyleClassNames() {
        const classNames = super.getInnerStyleClassNames();
        classNames.push(styleAdapter_1.style.getFolderBoxHeaderInnerClass());
        return classNames;
    }
}
exports.FolderBoxHeader = FolderBoxHeader;
