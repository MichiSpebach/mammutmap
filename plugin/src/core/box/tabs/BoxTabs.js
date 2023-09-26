"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxTabs = void 0;
const RenderManager_1 = require("../../RenderManager");
const Widget_1 = require("../../Widget");
const logService_1 = require("../../logService");
const BoxTabBarWidget_1 = require("./BoxTabBarWidget");
class BoxTabs {
    static register(tab) {
        if (this.registeredTabs.includes(tab)) {
            logService_1.log.warning(`BoxTabs.register('${tab.name}') already registered.`);
        }
        this.registeredTabs.push(tab);
    }
    static unregister(tab) {
        const index = this.registeredTabs.indexOf(tab);
        if (index < 0) {
            logService_1.log.warning(`BoxTabs.unregister('${tab.name}') not registered.`);
            return;
        }
        this.registeredTabs.splice(index, 1);
    }
    constructor(referenceBox) {
        this.referenceBox = referenceBox;
        this.rendered = false;
        this.contentRendered = false;
        this.bar = new BoxTabBarWidget_1.BoxTabBarWidget(this.getId() + '-bar', this, (tab) => this.setContent(tab));
    }
    getId() {
        return this.referenceBox.getId() + 'Tabs';
    }
    getContentId() {
        return this.getId() + 'Content';
    }
    async renderBar() {
        const ongoing = [];
        if (!this.rendered) {
            this.rendered = true;
            ongoing.push(RenderManager_1.renderManager.addElementTo(this.referenceBox.header.getId(), {
                type: 'div',
                id: this.getId(),
                style: {
                    backgroundColor: '#002040e0'
                },
                children: this.bar.shapeFormOuter()
            }));
        }
        ongoing.push(this.bar.render());
        await Promise.all(ongoing);
    }
    async unrenderBar() {
        this.bar.unrender();
    }
    async setContent(tab) {
        if (tab === 'map') {
            return this.clearContent();
        }
        let tabContent = await tab.buildWidget(this.referenceBox);
        let contentWidget = undefined;
        if (tabContent instanceof Widget_1.Widget) {
            contentWidget = tabContent;
            tabContent = {
                type: 'div',
                id: contentWidget.getId()
            };
        }
        if (this.contentRendered) {
            return RenderManager_1.renderManager.setElementsTo(this.getContentId(), tabContent);
        }
        this.contentRendered = true;
        const rendering = RenderManager_1.renderManager.addElementTo(this.getId(), {
            type: 'div',
            id: this.getContentId(),
            style: {
                padding: '0px 5px 5px 5px'
            },
            children: tabContent
        });
        if (contentWidget) {
            await contentWidget.render();
        }
        await rendering;
    }
    async clearContent() {
        if (!this.contentRendered) {
            return;
        }
        this.contentRendered = false;
        return RenderManager_1.renderManager.remove(this.getContentId());
    }
}
exports.BoxTabs = BoxTabs;
BoxTabs.registeredTabs = [];
