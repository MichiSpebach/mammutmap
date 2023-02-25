import { style } from '../styleAdapter'
import { LocalPosition } from '../shape/LocalPosition'
import { Link } from './Link'
import { util } from '../util/util'
import { renderManager } from '../RenderManager'

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

    public async formInnerHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, draggingInProgress: boolean, hoveringOver: boolean): Promise<string> {
        // TODO: use css for color, thickness, pointer-events (also change pointer-events to stroke if possible)
        // TODO: move coordinates to svg element, svg element only as big as needed?
        let lineHtml: string = this.formMainLineHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress)
        if ((draggingInProgress || hoveringOver) /*&& (this.from.isFloatToBorder() || this.to.isFloatToBorder())*/) { // TODO: activate floatToBorder option
            lineHtml = await this.formTargetLineHtml(draggingInProgress) + lineHtml
        }
        return lineHtml
    }
    
    private formMainLineHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, draggingInProgress: boolean): string {
        const positionHtml: string = 'x1="'+fromInManagingBoxCoords.percentX+'%" y1="'+fromInManagingBoxCoords.percentY+'%" x2="'+toInManagingBoxCoords.percentX+'%" y2="'+toInManagingBoxCoords.percentY+'%"'
        return `<line id="${this.getMainLineId()}" ${positionHtml} ${this.formLineClassHtml()} ${this.formLineStyleHtml(draggingInProgress)}/>`
    }
    
    private async formTargetLineHtml(draggingInProgress: boolean): Promise<string> {
        const fromTargetInManagingBoxCoordsPromise: Promise<LocalPosition> = this.referenceLink.from.getTargetPositionInManagingBoxCoords()
        const toTargetInManagingBoxCoords: LocalPosition = await this.referenceLink.to.getTargetPositionInManagingBoxCoords()
        const fromTargetInManagingBoxCoords: LocalPosition = await fromTargetInManagingBoxCoordsPromise
        const positionHtml: string = 'x1="'+fromTargetInManagingBoxCoords.percentX+'%" y1="'+fromTargetInManagingBoxCoords.percentY+'%" x2="'+toTargetInManagingBoxCoords.percentX+'%" y2="'+toTargetInManagingBoxCoords.percentY+'%"'
        return `<line id="${this.getTargetLineId()}" ${positionHtml} ${this.formLineClassHtml()} ${this.formLineStyleHtml(draggingInProgress)} stroke-dasharray="5"/>`
    }
    
    private formLineClassHtml(): string {
        const highlightClass: string = this.referenceLink.isHighlight() ? ' '+this.referenceLink.getHighlightClass() : ''
        return `class="${style.getHighlightTransitionClass()}${highlightClass}"`
    }
    
    private formLineStyleHtml(draggingInProgress: boolean): string {
        const pointerEventsStyle: string = draggingInProgress ? '' : 'pointer-events:auto;'
        return 'style="stroke:'+this.referenceLink.getColor()+';stroke-width:2px;'+pointerEventsStyle+'"'
    }
}

LinkLineImplementation = LinkLine