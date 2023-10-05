"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Link = exports.LinkImplementation = exports.override = void 0;
const util_1 = require("../util/util");
const RenderManager_1 = require("../RenderManager");
const styleAdapter_1 = require("../styleAdapter");
const contextMenu = require("../contextMenu");
const Box_1 = require("../box/Box");
const BoxLinks_1 = require("../box/BoxLinks");
const LinkEnd_1 = require("./LinkEnd");
const HoverManager_1 = require("../HoverManager");
const ClientPosition_1 = require("../shape/ClientPosition");
const LinkLine_1 = require("./LinkLine");
const RenderState_1 = require("../util/RenderState");
const SkipToNewestScheduler_1 = require("../util/SkipToNewestScheduler");
const RelocationDragManager_1 = require("../RelocationDragManager");
const logService_1 = require("../logService");
function override(implementation) {
    exports.LinkImplementation = implementation;
}
exports.override = override;
// important: always extend from LinkImplementation (important for plugins)
class Link {
    static new(data, managingBox) {
        return new exports.LinkImplementation(data, managingBox);
    }
    constructor(data, managingBox) {
        this.renderState = new RenderState_1.RenderState();
        this.renderScheduler = new SkipToNewestScheduler_1.SkipToNewestScheduler();
        this.highlight = false;
        this.draggingInProgress = false;
        this.hoveringOver = false;
        this.data = data;
        this.managingBox = managingBox;
        this.line = LinkLine_1.LinkLine.new(this.data.id + 'line', this);
        this.from = new LinkEnd_1.LinkEnd(this.data.id + 'from', this.data.from, this, 'square');
        this.to = new LinkEnd_1.LinkEnd(this.data.id + 'to', this.data.to, this, 'arrow');
    }
    getId() {
        return this.data.id;
    }
    getData() {
        return this.data;
    }
    getManagingBox() {
        return this.managingBox;
    }
    getManagingBoxLinks() {
        return this.managingBox.links;
    }
    getFrom() {
        return this.from;
    }
    getTo() {
        return this.to;
    }
    async renderWithOptions(options) {
        if (options.highlight !== undefined) {
            this.highlight = options.highlight;
        }
        if (options.draggingInProgress !== undefined) {
            this.draggingInProgress = options.draggingInProgress;
        }
        if (options.hoveringOver !== undefined) {
            this.hoveringOver = options.hoveringOver;
        }
        return this.render(options.priority);
    }
    async render(priority = RenderManager_1.RenderPriority.NORMAL) {
        if (!this.getManagingBox().isBodyBeingRendered()) {
            logService_1.log.warning(`Link::render(..) called for Link with id '${this.getId()}' unless the body of its managingBox with name '${this.getManagingBox().getName()}' is being unrendered.`);
            return;
        }
        await this.renderScheduler.schedule(async () => {
            if (!this.getManagingBox().isBodyBeingRendered()) {
                // no warning here as this is hard to prevent
                //log.warning(`Link::render(..) called for Link with id '${this.getId()}' unless the body of its managingBox with name '${this.getManagingBox().getName()}' is being unrendered. (rescheduled)`)
                return;
            }
            this.renderState.setRenderStarted();
            const fromInManagingBoxCoordsPromise = this.from.getRenderPositionInManagingBoxCoords();
            const toInManagingBoxCoords = await this.to.getRenderPositionInManagingBoxCoords();
            const fromInManagingBoxCoords = await fromInManagingBoxCoordsPromise;
            const lineInnerHtml = await this.line.formInnerHtml(fromInManagingBoxCoords, toInManagingBoxCoords, this.draggingInProgress, this.hoveringOver);
            const proms = [];
            if (!this.renderState.isRendered()) {
                const draggableHtml = RelocationDragManager_1.relocationDragManager.isUsingNativeDragEvents() ? 'draggable="true"' : '';
                const fromHtml = `<div id="${this.from.getId()}" ${draggableHtml} class="${styleAdapter_1.style.getHighlightTransitionClass()}"></div>`;
                const toHtml = `<div id="${this.to.getId()}" ${draggableHtml} class="${styleAdapter_1.style.getHighlightTransitionClass()}"></div>`;
                const lineStyle = 'position:absolute;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;';
                const lineHtml = `<svg id="${this.line.getId()}" style="${lineStyle}">${lineInnerHtml}</svg>`;
                await RenderManager_1.renderManager.setContentTo(this.getId(), lineHtml + fromHtml + toHtml, priority);
                proms.push(this.addEventListeners());
            }
            else {
                proms.push(RenderManager_1.renderManager.setContentTo(this.line.getId(), lineInnerHtml, priority));
            }
            // TODO: too many awaits, optimize
            const fromClientPosition = await this.managingBox.transform.localToClientPosition(fromInManagingBoxCoords);
            const toClientPosition = await this.managingBox.transform.localToClientPosition(toInManagingBoxCoords);
            const distanceX = toClientPosition.x - fromClientPosition.x;
            const distanceY = toClientPosition.y - fromClientPosition.y;
            const angleInRadians = Math.atan2(distanceY, distanceX);
            proms.push(this.from.render(fromInManagingBoxCoords, angleInRadians));
            proms.push(this.to.render(toInManagingBoxCoords, angleInRadians));
            await Promise.all(proms);
            this.renderState.setRenderFinished();
        });
    }
    async unrender() {
        await this.renderScheduler.schedule(async () => {
            if (this.renderState.isUnrendered()) {
                return;
            }
            this.renderState.setUnrenderStarted();
            await Promise.all([
                this.removeEventListeners(),
                this.from.unrender(),
                this.to.unrender()
            ]);
            await RenderManager_1.renderManager.clearContentOf(this.getId());
            this.renderState.setUnrenderFinished();
        });
    }
    getColor() {
        return styleAdapter_1.style.getLinkColor();
    }
    async addEventListeners() {
        const proms = [];
        proms.push(RenderManager_1.renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX, clientY) => contextMenu.openForLink(this, new ClientPosition_1.ClientPosition(clientX, clientY))));
        proms.push(HoverManager_1.HoverManager.addHoverable(this, () => this.handleHoverOver(), () => this.handleHoverOut()));
        await Promise.all(proms);
    }
    async removeEventListeners() {
        const proms = [];
        proms.push(HoverManager_1.HoverManager.removeHoverable(this));
        proms.push(RenderManager_1.renderManager.removeEventListenerFrom(this.getId(), 'contextmenu'));
        await Promise.all(proms);
    }
    async handleHoverOver() {
        if (this.renderState.isBeingUnrendered() || !this.getManagingBox().isBodyBeingRendered()) {
            this.highlight = true;
            this.hoveringOver = true;
            return;
        }
        await this.renderWithOptions({ priority: RenderManager_1.RenderPriority.RESPONSIVE, highlight: true, hoveringOver: true });
    }
    async handleHoverOut() {
        if (this.renderState.isBeingUnrendered() || !this.getManagingBox().isBodyBeingRendered()) {
            this.highlight = false;
            this.hoveringOver = false;
            return;
        }
        await this.renderWithOptions({ priority: RenderManager_1.RenderPriority.RESPONSIVE, highlight: false, hoveringOver: false });
    }
    isHighlight() {
        return this.highlight;
    }
    getHighlightClass() {
        return styleAdapter_1.style.getHighlightLinkClass();
    }
    async reorderAndSaveAndRender(options) {
        let newRenderedFromTarget;
        let newRenderedToTarget;
        if (options.movedLinkEnd) {
            if (options.movedLinkEnd === this.from) {
                newRenderedFromTarget = options.movedWayPoint;
            }
            else if (options.movedLinkEnd === this.to) {
                newRenderedToTarget = options.movedWayPoint;
            }
            else {
                util_1.util.logWarning('Link::reorderAndSaveAndRender(..) movedLinkEnd is neither fromLinkEnd nor toLinkEnd.');
            }
        }
        else {
            if (this.from.isBoxInPath(options.movedWayPoint)) {
                newRenderedFromTarget = options.movedWayPoint;
            }
            if (this.to.isBoxInPath(options.movedWayPoint)) {
                newRenderedToTarget = options.movedWayPoint;
            }
        }
        if (!newRenderedFromTarget && !newRenderedToTarget) {
            util_1.util.logWarning('Link::reorderAndSaveAndRender(..) movedWayPoint is neither in fromPath nor in toPath.');
        }
        if (!newRenderedFromTarget) {
            newRenderedFromTarget = this.from.getDeepestRenderedWayPoint().linkable;
        }
        if (!newRenderedToTarget) {
            newRenderedToTarget = this.to.getDeepestRenderedWayPoint().linkable;
        }
        const commonAncestor = Box_1.Box.findCommonAncestor(newRenderedFromTarget, newRenderedToTarget).commonAncestor;
        const oldManagingBox = this.managingBox;
        this.managingBox = commonAncestor;
        await Promise.all([
            this.from.reorderMapDataPathWithoutRender({ newManagingBoxForValidation: this.managingBox, movedWayPoint: newRenderedFromTarget }),
            this.to.reorderMapDataPathWithoutRender({ newManagingBoxForValidation: this.managingBox, movedWayPoint: newRenderedToTarget })
        ]);
        const pros = [];
        if (oldManagingBox !== this.managingBox) {
            pros.push(BoxLinks_1.BoxLinks.changeManagingBoxOfLinkAndSave(oldManagingBox, this.managingBox, this));
        }
        else {
            pros.push(this.managingBox.saveMapData());
        }
        pros.push(this.renderWithOptions(options));
        await Promise.all(pros);
    }
    async getLineInClientCoords() {
        const fromPosition = this.from.getTargetPositionInClientCoords();
        const toPosition = this.to.getTargetPositionInClientCoords();
        return {
            from: await fromPosition,
            to: await toPosition
        };
    }
    async getLineInManagingBoxCoords() {
        const fromPosition = this.from.getTargetPositionInManagingBoxCoords();
        const toPosition = this.to.getTargetPositionInManagingBoxCoords();
        return {
            from: await fromPosition,
            to: await toPosition
        };
    }
    getTags() {
        if (!this.data.tags) {
            return [];
        }
        return this.data.tags;
    }
    includesTag(tag) {
        if (!this.data.tags) {
            return false;
        }
        return this.data.tags.includes(tag);
    }
    async addTag(tag) {
        if (this.includesTag(tag)) {
            util_1.util.logWarning(`tag '${tag}' is already included in link '${this.getId()}'`);
            return;
        }
        if (!this.data.tags) {
            this.data.tags = [];
        }
        this.data.tags.push(tag);
        await Promise.all([
            this.render(),
            this.managingBox.saveMapData(),
            this.managingBox.getProjectSettings().countUpLinkTagAndSave(tag)
        ]);
    }
    async removeTag(tag) {
        if (!this.includesTag(tag) || !this.data.tags) {
            util_1.util.logWarning(`tag '${tag}' is not included in link '${this.getId()}'`);
            return;
        }
        this.data.tags.splice(this.data.tags.indexOf(tag), 1);
        await Promise.all([
            this.render(),
            this.managingBox.saveMapData(),
            this.managingBox.getProjectSettings().countDownLinkTagAndSave(tag)
        ]);
    }
}
exports.Link = Link;
exports.LinkImplementation = Link;
