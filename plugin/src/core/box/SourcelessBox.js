"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SourcelessBox = void 0;
const RenderManager_1 = require("../RenderManager");
const styleAdapter_1 = require("../styleAdapter");
const contextMenu = require("../contextMenu");
const Box_1 = require("./Box");
const SourcelessBoxHeader_1 = require("./header/SourcelessBoxHeader");
const ClientPosition_1 = require("../shape/ClientPosition");
const logService_1 = require("../logService");
class SourcelessBox extends Box_1.Box {
    constructor(name, parent, mapData, mapDataFileExists, type, context) {
        super(name, parent, mapData, mapDataFileExists, context);
        this.bodyRendered = false;
        this.type = type;
    }
    createHeader() {
        return new SourcelessBoxHeader_1.SourcelessBoxHeader(this);
    }
    isFolder() {
        return false;
    }
    isFile() {
        return false;
    }
    isSourceless() {
        return true;
    }
    getBodyOverflowStyle() {
        return 'hidden';
    }
    getBackgroundStyleClass() {
        return styleAdapter_1.style.getSourcelessBoxBackgroundClass();
    }
    async renderAdditional() {
        if (this.isRendered()) {
            return;
        }
        await RenderManager_1.renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX, clientY) => contextMenu.openForSourcelessBox(this, new ClientPosition_1.ClientPosition(clientX, clientY)));
    }
    async unrenderAdditional() {
        if (!this.isRendered()) {
            return;
        }
        await RenderManager_1.renderManager.removeEventListenerFrom(this.getId(), 'contextmenu');
    }
    getBodyId() {
        return this.getId() + 'Body';
    }
    async renderBody() {
        await RenderManager_1.renderManager.setElementTo(this.getBodyId(), {
            type: 'div',
            style: {
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100%'
            },
            children: {
                type: 'div',
                children: this.buildBodyChildren()
            }
        });
        this.bodyRendered = true;
    }
    buildBodyChildren() {
        if (this.type === 'source not found') {
            return [
                { type: 'div', children: 'Source not found, maybe it was moved or renamed.' },
                { type: 'div', children: 'Drag to other box or drop other box here to fuse. (coming soon)' },
                { type: 'button', onclick: () => logService_1.log.warning('Autofix is not implemented yet.'), children: 'Autofix (coming soon)' } // TODO: implement
            ];
        }
        if (this.type === 'unknown source type') {
            return 'Neither file nor directory.';
        }
        logService_1.log.warning(`Unknown SourcelessBoxType '${this.type}' in '${this.getName()}'.`);
        return `Unknown SourcelessBoxType '${this.type}'.`;
    }
    async unrenderBodyIfPossible(force) {
        await RenderManager_1.renderManager.setContentTo(this.getBodyId(), '');
        this.bodyRendered = false;
        return { rendered: false };
    }
    isBodyRendered() {
        return this.bodyRendered;
    }
    isBodyBeingRendered() {
        return this.bodyRendered; // TODO: this is not always correct, add generic ${public readonly body: BoxBody} to Box and remove implementation in subclasses of Box
    }
    getInnerLinksRecursive() {
        return [this.links];
    }
}
exports.SourcelessBox = SourcelessBox;
