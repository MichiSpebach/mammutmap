"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourcelessBoxHeader = void 0;
const styleAdapter_1 = require("../../styleAdapter");
const BoxHeader_1 = require("./BoxHeader");
class SourcelessBoxHeader extends BoxHeader_1.BoxHeader {
    getInnerStyleClassNames() {
        const classNames = super.getInnerStyleClassNames();
        classNames.push(styleAdapter_1.style.getSourcelessBoxHeaderInnerClass());
        return classNames;
    }
}
exports.SourcelessBoxHeader = SourcelessBoxHeader;
