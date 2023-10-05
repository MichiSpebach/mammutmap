"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileBox = void 0;
const RenderManager_1 = require("../RenderManager");
const styleAdapter_1 = require("../styleAdapter");
const contextMenu = require("../contextMenu");
const Box_1 = require("./Box");
const FileBoxHeader_1 = require("./header/FileBoxHeader");
const FileBoxBody_1 = require("./FileBoxBody");
const ClientPosition_1 = require("../shape/ClientPosition");
class FileBox extends Box_1.Box {
    constructor(name, parent, mapData, mapDataFileExists, context) {
        super(name, parent, mapData, mapDataFileExists, context);
        this.body = new FileBoxBody_1.FileBoxBody(this);
    }
    createHeader() {
        return new FileBoxHeader_1.FileBoxHeader(this);
    }
    isFolder() {
        return false;
    }
    isFile() {
        return true;
    }
    isSourceless() {
        return false;
    }
    getAdditionalStyle() {
        return null;
    }
    getBodyOverflowStyle() {
        return 'auto';
    }
    getBackgroundStyleClass() {
        return styleAdapter_1.style.getFileBoxBackgroundClass();
    }
    async renderAdditional() {
        if (this.isRendered()) {
            return;
        }
        await RenderManager_1.renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX, clientY) => contextMenu.openForFileBox(this, new ClientPosition_1.ClientPosition(clientX, clientY)));
    }
    async unrenderAdditional() {
        if (!this.isRendered()) {
            return;
        }
        await RenderManager_1.renderManager.removeEventListenerFrom(this.getId(), 'contextmenu');
    }
    getBody() {
        return this.body;
    }
    getBodyId() {
        return this.body.getId();
    }
    async renderBody() {
        await this.body.render();
    }
    async unrenderBodyIfPossible() {
        return this.body.unrenderIfPossible();
    }
    isBodyRendered() {
        return this.body.isRendered();
    }
    isBodyBeingRendered() {
        return this.body.isBeingRendered();
    }
    getInnerLinksRecursive() {
        return [this.links];
    }
}
exports.FileBox = FileBox;
