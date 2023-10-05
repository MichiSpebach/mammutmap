"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxNodesWidget = void 0;
const RenderManager_1 = require("../RenderManager");
const NodeWidget_1 = require("../node/NodeWidget");
const Widget_1 = require("../Widget");
const util_1 = require("../util/util");
const RelocationDragManager_1 = require("../RelocationDragManager");
class BoxNodesWidget extends Widget_1.Widget {
    constructor(referenceBox) {
        super();
        this.nodeWidgets = [];
        this.rendered = false;
        this.referenceBox = referenceBox;
    }
    getId() {
        return this.referenceBox.getId() + 'Nodes';
    }
    getNodeById(id) {
        return this.nodeWidgets.find(node => node.getId() === id);
    }
    getNodes() {
        return this.nodeWidgets;
    }
    async render() {
        if (this.rendered) {
            return;
        }
        for (const nodeData of this.referenceBox.getMapNodeData()) {
            if (this.nodeWidgets.find(nodeWidget => nodeWidget.getId() === nodeData.id)) {
                continue;
            }
            this.nodeWidgets.push(new NodeWidget_1.NodeWidget(nodeData, this.referenceBox));
        }
        const nodePlaceholders = this.nodeWidgets
            .filter(node => !node.isBeingRendered()) // this happens for nodes that where dropped in when this was not rendered
            .reduce((placeholders, node) => placeholders += this.formHtmlPlaceholderFor(node), '');
        await RenderManager_1.renderManager.addContentTo(this.getId(), nodePlaceholders);
        await Promise.all(this.nodeWidgets.map(async (node) => {
            await node.render();
        }));
        this.rendered = true;
    }
    async unrender() {
        if (!this.rendered) {
            return;
        }
        await Promise.all(this.nodeWidgets.map(async (node) => {
            await node.unrender();
        }));
        await RenderManager_1.renderManager.setContentTo(this.getId(), '');
        this.nodeWidgets = [];
        this.rendered = false;
    }
    static async changeManagingBoxOfNodeAndSave(oldManagingBox, newManagingBox, node) {
        if (node.getManagingBox() !== newManagingBox) {
            util_1.util.logWarning('managingBox ' + node.getManagingBox().getSrcPath() + ' of given node ' + node.getId() + ' does not match newManagingBox ' + newManagingBox.getSrcPath());
        }
        if (newManagingBox.nodes.nodeWidgets.includes(node)) {
            util_1.util.logWarning('box ' + newManagingBox.getSrcPath() + ' already manages node ' + node.getId());
        }
        if (!oldManagingBox.nodes.nodeWidgets.includes(node)) {
            util_1.util.logWarning('box ' + oldManagingBox.getSrcPath() + ' does not manage node ' + node.getId());
        }
        const proms = [];
        newManagingBox.nodes.nodeWidgets.push(node);
        proms.push(RenderManager_1.renderManager.appendChildTo(newManagingBox.nodes.getId(), node.getId()));
        oldManagingBox.nodes.nodeWidgets.splice(oldManagingBox.nodes.nodeWidgets.indexOf(node), 1);
        newManagingBox.getMapNodeData().push(node.getMapData());
        oldManagingBox.getMapNodeData().splice(oldManagingBox.getMapNodeData().indexOf(node.getMapData()), 1);
        proms.push(newManagingBox.saveMapData());
        proms.push(oldManagingBox.saveMapData());
        await Promise.all(proms);
    }
    async add(data) {
        this.referenceBox.getMapNodeData().push(data);
        const nodeWidget = new NodeWidget_1.NodeWidget(data, this.referenceBox);
        this.nodeWidgets.push(nodeWidget);
        await RenderManager_1.renderManager.addContentTo(this.getId(), this.formHtmlPlaceholderFor(nodeWidget));
        await nodeWidget.render();
        await this.referenceBox.saveMapData();
    }
    formHtmlPlaceholderFor(node) {
        const draggableHtml = RelocationDragManager_1.relocationDragManager.isUsingNativeDragEvents() ? 'draggable="true"' : '';
        return `<div id="${node.getId()}" ${draggableHtml}></div>`;
    }
}
exports.BoxNodesWidget = BoxNodesWidget;
