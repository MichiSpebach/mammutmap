"use strict";
// TODO: create folder/module rendering and move RenderElement.ts, renderManager.ts, domAdapter.ts into there
Object.defineProperty(exports, "__esModule", { value: true });
exports.concatRenderElements = void 0;
function concatRenderElements(elementsList) {
    return elementsList.flat();
}
exports.concatRenderElements = concatRenderElements;
