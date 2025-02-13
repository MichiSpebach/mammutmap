import { style } from '../styleAdapter'
import { LocalPosition } from '../shape/LocalPosition'
import { Link } from './Link'
import { util } from '../util/util'
import { renderManager } from '../renderEngine/renderManager'

export function override(implementation: typeof LinkLineImplementation): void {
    LinkLineImplementation = implementation
}

export let LinkLineImplementation: typeof LinkLine /*= LinkLine*/ // assigned after declaration at end of file

export class LinkLine {
    private readonly id: string
    protected readonly referenceLink: Link
    private rendered: boolean = false

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

    public async formInnerHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, draggingInProgress: boolean, hoveringOver: boolean, selected: boolean): Promise<string> {
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
        return lineHtml
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
        return `<line id="${this.getTargetLineId()}" ${positionHtml} ${this.formLineClassHtml()} ${this.formLineStyleHtml()} stroke-dasharray="5"/>`
    }

    private formHoverAreaHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, hoveringOver: boolean): string {
        const positionHtml: string = 'x1="'+fromInManagingBoxCoords.percentX+'%" y1="'+fromInManagingBoxCoords.percentY+'%" x2="'+toInManagingBoxCoords.percentX+'%" y2="'+toInManagingBoxCoords.percentY+'%"'
        return `<line id="${this.getHoverAreaId()}" ${positionHtml} style="stroke-width:${hoveringOver ? 8 : 4}px;pointer-events:stroke;"/>`
    }

    private formSelectedHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, hoveringOver: boolean): string {
        const positionHtml: string = 'x1="'+fromInManagingBoxCoords.percentX+'%" y1="'+fromInManagingBoxCoords.percentY+'%" x2="'+toInManagingBoxCoords.percentX+'%" y2="'+toInManagingBoxCoords.percentY+'%"'
        //let html = `<line id="${this.getHoverAreaId()}" ${positionHtml} style="stroke:#fff;stroke-dasharray:3px;stroke-width:1px;"/>`
        //html += `<line id="${this.getHoverAreaId()}" ${positionHtml} style="stroke:#444;stroke-dasharray:3px,9px;stroke-dashoffset:3px;stroke-width:1px;"/>`
        const width: number = hoveringOver || this.referenceLink.isHighlight() ? 6 : 4
        return `<line id="${this.getSelectedId()}" ${positionHtml} style="stroke:#abc;stroke-dasharray:4px;stroke-width:${width}px;"/>`
    }
    
    private formLineClassHtml(): string {
        const highlightClass: string = this.referenceLink.isHighlight() ? ' '+this.referenceLink.getHighlightClass() : ''
        return `class="${style.getHighlightTransitionClass()}${highlightClass}"`
    }
    
    private formLineStyleHtml(): string {
        return 'style="stroke:'+this.referenceLink.getColor()+';stroke-width:2px;"'
    }
}

LinkLineImplementation = LinkLine