"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BorderingLinks = void 0;
class BorderingLinks {
    constructor(referenceBoxOrNode) {
        this.referenceBoxOrNode = referenceBoxOrNode;
    }
    getAll() {
        if (this.referenceBoxOrNode.isRoot()) {
            return [];
        }
        const allParentLinks = [
            ...this.referenceBoxOrNode.getParent().links.getLinks(),
            ...this.referenceBoxOrNode.getParent().borderingLinks.getAll()
        ];
        const boxOrNodeId = this.referenceBoxOrNode.getId();
        return allParentLinks.filter(link => {
            return link.getData().from.path.some((wayPoint) => wayPoint.boxId === boxOrNodeId)
                || link.getData().to.path.some((wayPoint) => wayPoint.boxId === boxOrNodeId);
        });
    }
    async renderAll() {
        await Promise.all(this.getAll().map(link => link.render()));
    }
    async renderAllThatShouldBe() {
        await Promise.all(this.getLinksThatShouldBeRendered().map(link => link.render()));
    }
    async setHighlightAllThatShouldBeRendered(highlight) {
        await Promise.all(this.getLinksThatShouldBeRendered().map(link => link.renderWithOptions({ highlight })));
    }
    getLinksThatShouldBeRendered() {
        return this.getAll().filter(link => link.getManagingBox().isBodyBeingRendered());
    }
    getOutgoing() {
        return this.getAll().filter(link => link.from.getRenderedPathWithoutManagingBox().includes(this.referenceBoxOrNode));
    }
}
exports.BorderingLinks = BorderingLinks;
