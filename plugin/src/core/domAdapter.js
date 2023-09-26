"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.dom = exports.cursorStyles = void 0;
exports.cursorStyles = ['auto', 'default', 'text', 'pointer', 'grab', 'ns-resize', 'ew-resize', 'nwse-resize']; // "as const" makes CursorStyle a typesafe union of literals
function init(object) {
    exports.dom = object;
}
exports.init = init;
