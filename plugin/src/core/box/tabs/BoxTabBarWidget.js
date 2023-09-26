"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxTabBarWidget = void 0;
const RenderManager_1 = require("../../RenderManager");
const Widget_1 = require("../../Widget");
const logService_1 = require("../../logService");
const BoxTabs_1 = require("./BoxTabs");
class BoxTabBarWidget extends Widget_1.Widget {
    constructor(id, parent, onSelect) {
        super();
        this.id = id;
        this.parent = parent;
        this.onSelect = onSelect;
        this.someTabRendered = false;
        this.selectedTab = 'map';
    }
    getId() {
        return this.id;
    }
    async render() {
        if (this.someTabRendered) {
            logService_1.log.warning('BoxTabBarWidget::render() already rendered.');
            return;
        }
        const pros = BoxTabs_1.BoxTabs.registeredTabs.map(tab => this.renderTab(tab));
        await Promise.all(pros);
    }
    async unrender() {
        if (!this.someTabRendered) {
            return;
        }
        this.someTabRendered = false;
        await RenderManager_1.renderManager.clearContentOf(this.getId());
    }
    getTabId(tab) {
        return tab === 'map'
            ? this.getId() + 'Map'
            : this.getId() + tab.name;
    }
    async renderTab(tab) {
        if (!await tab.isAvailableFor(this.parent.referenceBox)) {
            return;
        }
        const ongoing = [];
        const tabElement = {
            type: 'button',
            id: this.getTabId(tab),
            style: this.getTabStyle(tab),
            onclick: () => this.select(tab),
            children: tab.name
        };
        if (this.someTabRendered) {
            ongoing.push(RenderManager_1.renderManager.addElementTo(this.getId(), tabElement));
        }
        else {
            this.someTabRendered = true;
            const defaultMapTabElement = {
                type: 'button',
                id: this.getTabId('map'),
                style: this.getTabStyle('map'),
                onclick: () => this.select('map'),
                children: 'Map'
            };
            ongoing.push(RenderManager_1.renderManager.addElementsTo(this.getId(), [defaultMapTabElement, tabElement]));
        }
        if (tab.isDefaultSelectedFor && await tab.isDefaultSelectedFor(this.parent.referenceBox)) {
            ongoing.push(this.select(tab));
        }
        await Promise.all(ongoing);
    }
    getTabStyle(tab) {
        let style = {
            padding: '4px 8px',
            fontSize: 'inherit',
            color: 'inherit',
            backgroundColor: '#222',
            border: 'none',
            borderRight: '1px solid gray',
            borderBottom: '1px solid gray',
            cursor: 'pointer'
        };
        if (this.selectedTab === tab) {
            style = {
                ...style,
                backgroundColor: 'transparent',
                borderBottom: 'none'
            };
        }
        return style;
    }
    async select(tab) {
        const oldSelectedTab = this.selectedTab;
        this.selectedTab = tab;
        await Promise.all([
            RenderManager_1.renderManager.setStyleTo(this.getTabId(oldSelectedTab), this.getTabStyle(oldSelectedTab)),
            RenderManager_1.renderManager.setStyleTo(this.getTabId(this.selectedTab), this.getTabStyle(this.selectedTab)),
            this.onSelect(tab)
        ]);
    }
    shapeFormOuter() {
        return {
            type: 'div',
            id: this.getId()
        };
    }
}
exports.BoxTabBarWidget = BoxTabBarWidget;
