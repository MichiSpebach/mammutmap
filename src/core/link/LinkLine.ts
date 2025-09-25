import { style } from '../styleAdapter'
import { LocalPosition } from '../shape/LocalPosition'
import { Link } from './Link'
import { renderManager, RenderPriority } from '../renderEngine/renderManager'

export function override(implementation: typeof LinkLineImplementation): void {
    LinkLineImplementation = implementation
}

export let LinkLineImplementation: typeof LinkLine /*= LinkLine*/ // assigned after declaration at end of file

export class LinkLine {
    private readonly id: string
    protected readonly referenceLink: Link
    private renderedHighlight: {foregrounded: boolean} = {foregrounded: false}

    public static new(id: string, referenceLink: Link): LinkLine {
        return new LinkLineImplementation(id, referenceLink)
    }

    protected constructor(id: string, referenceLink: Link) {
        this.id = id
        this.referenceLink = referenceLink
    }

    public getId(): string {
        return this.id
    }

    private getMainLineId(): string {
        return this.id+'Main'
    }

    private getTargetLineId(): string {
        return this.id+'Target'
    }

    private getHoverAreaId(): string {
        return this.id+'Hover'
    }

    private getSelectedId(): string {
        return this.id+'Selected'
    }

    protected getStyleAsString(): string {
        return ''
    }

    public async formOuterHtml(additionalStyle: string): Promise<string> {
        return `<svg id="${this.id}" style="${this.getStyleAsString()}${additionalStyle}"></svg>`
    }

    public async render(
        fromInManagingBoxCoords: LocalPosition,
        toInManagingBoxCoords: LocalPosition,
        draggingInProgress: boolean,
        hoveringOver: boolean,
        selected: boolean,
        priority: RenderPriority = RenderPriority.NORMAL
    ): Promise<void> {
        // TODO: move coordinates to svg element, svg element only as big as needed, or draw all lines of a box into one svg?
        let lineHtml: string = ''
        if (!draggingInProgress) {
            lineHtml += this.formHoverAreaHtml(fromInManagingBoxCoords, toInManagingBoxCoords, hoveringOver)
        }
        if (selected) {
            lineHtml += this.formSelectedHtml(fromInManagingBoxCoords, toInManagingBoxCoords, hoveringOver)
        }
        if ((draggingInProgress || hoveringOver) /*&& (this.from.isFloatToBorder() || this.to.isFloatToBorder())*/) { // TODO: activate floatToBorder option
            lineHtml += await this.formTargetLineHtml()
        }
        lineHtml += this.formMainLineHtml(fromInManagingBoxCoords, toInManagingBoxCoords)

        await Promise.all([
            renderManager.setContentTo(this.getId(), lineHtml, priority),
            this.updateHighlightForegrounded(priority)
        ])
    }
    
    private formMainLineHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition): string {
        const positionHtml: string = 'x1="'+fromInManagingBoxCoords.percentX+'%" y1="'+fromInManagingBoxCoords.percentY+'%" x2="'+toInManagingBoxCoords.percentX+'%" y2="'+toInManagingBoxCoords.percentY+'%"'
        return `<line id="${this.getMainLineId()}" ${positionHtml} ${this.formLineClassHtml()} ${this.formLineStyleHtml()}/>`
    }
    
    private async formTargetLineHtml(): Promise<string> {
        const fromTargetInManagingBoxCoordsPromise: Promise<LocalPosition> = this.referenceLink.from.getTargetPositionInManagingBoxCoords()
        const toTargetInManagingBoxCoords: LocalPosition = await this.referenceLink.to.getTargetPositionInManagingBoxCoords()
        const fromTargetInManagingBoxCoords: LocalPosition = await fromTargetInManagingBoxCoordsPromise
        const positionHtml: string = 'x1="'+fromTargetInManagingBoxCoords.percentX+'%" y1="'+fromTargetInManagingBoxCoords.percentY+'%" x2="'+toTargetInManagingBoxCoords.percentX+'%" y2="'+toTargetInManagingBoxCoords.percentY+'%"'
        return `<line id="${this.getTargetLineId()}" ${positionHtml} ${this.formLineClassHtml()} ${this.formLineStyleHtml()} stroke-dasharray="4"/>`
    }

    private formHoverAreaHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, hoveringOver: boolean): string {
        const positionHtml: string = 'x1="'+fromInManagingBoxCoords.percentX+'%" y1="'+fromInManagingBoxCoords.percentY+'%" x2="'+toInManagingBoxCoords.percentX+'%" y2="'+toInManagingBoxCoords.percentY+'%"'
        return `<line id="${this.getHoverAreaId()}" ${positionHtml} style="${hoveringOver ? 'stroke:#fff2;' : ''}stroke-width:${hoveringOver ? this.getLineWidthInPixel()+8 : this.getLineWidthInPixel()+2}px;pointer-events:stroke;"/>`
    }

    private formSelectedHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, hoveringOver: boolean): string {
        const positionHtml: string = 'x1="'+fromInManagingBoxCoords.percentX+'%" y1="'+fromInManagingBoxCoords.percentY+'%" x2="'+toInManagingBoxCoords.percentX+'%" y2="'+toInManagingBoxCoords.percentY+'%"'
        //let html = `<line id="${this.getHoverAreaId()}" ${positionHtml} style="stroke:#fff;stroke-dasharray:3px;stroke-width:1px;"/>`
        //html += `<line id="${this.getHoverAreaId()}" ${positionHtml} style="stroke:#444;stroke-dasharray:3px,9px;stroke-dashoffset:3px;stroke-width:1px;"/>`
        return `<line id="${this.getSelectedId()}" ${positionHtml} style="stroke:#abc;stroke-dasharray:4px;stroke-width:${this.getLineWidthInPixel()+2}px;"/>`
    }
    
    private formLineClassHtml(): string {
        const highlightClass: string = this.referenceLink.getHighlights().isBright() ? ' '+style.getHighlightLinkBrightClass() : ''
        return `class="${style.getHighlightTransitionClass()}${highlightClass}"`
    }
    
    private formLineStyleHtml(): string {
        return `style="stroke:${this.referenceLink.getColor()};stroke-width:${this.getLineWidthInPixel()}px;"`
    }

    private getLineWidthInPixel(): number {
        return 2
    }

    private async updateHighlightForegrounded(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        if (this.referenceLink.getHighlights().isForegrounded()) {
            if (!this.renderedHighlight.foregrounded) {
                this.renderedHighlight.foregrounded = true
                await renderManager.addClassTo(this.getId(), style.getHighlightLinkForegroundClass(), priority)
            }
        } else {
            if (this.renderedHighlight.foregrounded) {
                this.renderedHighlight.foregrounded = false
                await renderManager.removeClassFrom(this.getId(), style.getHighlightLinkForegroundClass(), priority)
            }
        }
    }
}

LinkLineImplementation = LinkLine