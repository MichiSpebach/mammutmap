"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BoxLinks = void 0;
const util_1 = require("../util/util");
const RenderManager_1 = require("../RenderManager");
const Link_1 = require("../link/Link");
const LinkData_1 = require("../mapData/LinkData");
const WayPointData_1 = require("../mapData/WayPointData");
const LinkEndData_1 = require("../mapData/LinkEndData");
const NodeWidget_1 = require("../node/NodeWidget");
const Widget_1 = require("../Widget");
const SkipToNewestScheduler_1 = require("../util/SkipToNewestScheduler");
const logService_1 = require("../logService");
class BoxLinks extends Widget_1.Widget {
    constructor(referenceBox) {
        super();
        this.links = [];
        this.rendered = false;
        this.renderScheduler = new SkipToNewestScheduler_1.SkipToNewestScheduler();
        this.referenceBox = referenceBox;
    }
    getId() {
        return this.referenceBox.getId() + 'Links';
    }
    static async changeManagingBoxOfLinkAndSave(oldManagingBox, newManagingBox, link) {
        if (link.getManagingBox() !== newManagingBox) {
            util_1.util.logWarning('managingBox ' + link.getManagingBox().getSrcPath() + ' of given link ' + link.getId() + ' does not match newManagingBox ' + newManagingBox.getSrcPath());
        }
        if (newManagingBox.links.links.includes(link)) {
            util_1.util.logWarning('box ' + newManagingBox.getSrcPath() + ' already manages link ' + link.getId());
        }
        if (!oldManagingBox.links.links.includes(link)) {
            util_1.util.logWarning('box ' + oldManagingBox.getSrcPath() + ' does not manage link ' + link.getId());
        }
        const proms = [];
        newManagingBox.links.links.push(link);
        proms.push(RenderManager_1.renderManager.appendChildTo(newManagingBox.links.getId(), link.getId()));
        oldManagingBox.links.links.splice(oldManagingBox.links.links.indexOf(link), 1);
        newManagingBox.getMapLinkData().push(link.getData());
        oldManagingBox.getMapLinkData().splice(oldManagingBox.getMapLinkData().indexOf(link.getData()), 1);
        proms.push(newManagingBox.saveMapData());
        proms.push(oldManagingBox.saveMapData());
        await Promise.all(proms);
    }
    async add(from, to) {
        if (!this.referenceBox.isAncestorOf(from)) {
            logService_1.log.warning(`BoxLinks::add(from: ${from.getName()}, to: ${to.getName()}) from is not an descendant of referred box (${this.referenceBox.getName()}).`);
        }
        if (!this.referenceBox.isAncestorOf(to)) {
            logService_1.log.warning(`BoxLinks::add(from: ${from.getName()}, to: ${to.getName()}) to is not an descendant of referred box (${this.referenceBox.getName()}).`);
        }
        const fromWayPoint = WayPointData_1.WayPointData.buildNew(from.getId(), from.getName(), 50, 50);
        const toWayPoint = WayPointData_1.WayPointData.buildNew(to.getId(), to.getName(), 50, 50);
        const fromLinkEnd = { mapData: new LinkEndData_1.LinkEndData([fromWayPoint]), linkable: from };
        const toLinkEnd = { mapData: new LinkEndData_1.LinkEndData([toWayPoint]), linkable: to };
        return this.addLink(fromLinkEnd, toLinkEnd, true);
    }
    // TODO: rename to addWithData
    async addLink(from, to, reorderAndSave) {
        const linkData = new LinkData_1.LinkData(util_1.util.generateId(), from.mapData, to.mapData);
        this.referenceBox.getMapLinkData().push(linkData);
        const link = Link_1.Link.new(linkData, this.referenceBox);
        this.links.push(link);
        await this.addPlaceholderFor(link);
        if (reorderAndSave) {
            await link.reorderAndSaveAndRender({ movedWayPoint: from.linkable }); // TODO: decide and handle reorder in Link.new(..) and remove reorderAndSave option
            await link.reorderAndSaveAndRender({ movedWayPoint: to.linkable }); // TODO: decide and handle reorder in Link.new(..) and remove reorderAndSave option
        }
        else {
            await link.render();
        }
        return link;
    }
    async removeLink(link) {
        if (!this.links.includes(link)) {
            util_1.util.logWarning('trying to remove link from box "' + this.referenceBox.getName() + '" that is not managed by that box');
            return;
        }
        await link.unrender();
        await this.removePlaceholderFor(link);
        this.links.splice(this.links.indexOf(link), 1);
        this.referenceBox.getMapLinkData().splice(this.referenceBox.getMapLinkData().indexOf(link.getData()), 1);
        await this.referenceBox.saveMapData();
    }
    async render() {
        await this.renderScheduler.schedule(async () => {
            if (this.rendered) {
                // links that are connected to NodeWidgets need to be rerendered
                // because size of NodeWidgets is not percental // TODO: use smart css attributes to handle this
                this.links.filter(link => {
                    return link.from.getDeepestRenderedWayPoint().linkable instanceof NodeWidget_1.NodeWidget
                        || link.to.getDeepestRenderedWayPoint().linkable instanceof NodeWidget_1.NodeWidget;
                }).forEach(link => link.render());
                return;
            }
            const placeholderPros = [];
            for (const linkData of this.referenceBox.getMapLinkData()) {
                if (this.links.find(link => link.getId() === linkData.id)) {
                    continue;
                }
                const link = Link_1.Link.new(linkData, this.referenceBox);
                this.links.push(link);
                placeholderPros.push(this.addPlaceholderFor(link));
            }
            await Promise.all(placeholderPros);
            await Promise.all(this.links.map((link) => link.render()));
            this.rendered = true;
        });
    }
    async addPlaceholderFor(link) {
        await RenderManager_1.renderManager.addContentTo(this.getId(), '<div id="' + link.getId() + '"></div>');
    }
    async removePlaceholderFor(link) {
        await RenderManager_1.renderManager.remove(link.getId());
    }
    async unrender() {
        await this.renderScheduler.schedule(async () => {
            if (!this.rendered) {
                return;
            }
            await Promise.all(this.links.map(async (link) => {
                await link.unrender();
                await this.removePlaceholderFor(link);
            }));
            this.links = [];
            this.rendered = false;
        });
    }
    getLinkWithEndBoxes(from, to) {
        return this.links.find((link) => {
            const linkFromWayPoints = link.getData().from.path;
            const linkToWayPoints = link.getData().to.path;
            const linkFromBoxId = linkFromWayPoints[linkFromWayPoints.length - 1].boxId;
            const linkToBoxId = linkToWayPoints[linkToWayPoints.length - 1].boxId;
            return linkFromBoxId === from.getId() && linkToBoxId === to.getId();
        });
    }
    static getLinkRouteWithEndBoxes(from, to, options = { maxNodes: 2, }) {
        const directed = false;
        if (options.maxNodes < 0) {
            return undefined;
        }
        for (const link of from.borderingLinks.getOutgoing()) {
            const node = link.to.getDeepestRenderedWayPoint().linkable;
            if (node.getId() === to.getId()) {
                return [link];
            }
            const linkToPath = link.getData().to.path;
            const linkTargetId = linkToPath[linkToPath.length - 1].boxId;
            if (linkTargetId !== node.getId()) {
                logService_1.log.warning(`BoxLinks::getLinkRouteWithEndBoxes(..) linkTargetId(${linkTargetId}) does not match deepestRenderedNodeId(${node.getId()}).`);
            }
            const route = this.getLinkRouteWithEndBoxes(node, to, { maxNodes: options.maxNodes-- });
            if (route) {
                return [link, ...route];
            }
        }
        return undefined;
    }
    getLinks() {
        return this.links;
    }
}
exports.BoxLinks = BoxLinks;
