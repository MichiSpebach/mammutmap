import { LocalPosition } from '../../dist/box/Transform'
import { LinkLineImplementation } from '../../dist/link/LinkLine'
import { LinkAppearanceMode } from '../../dist/mapData/LinkAppearanceData'
import { util } from '../../dist/util'
import * as linkDidactorSettings from './linkDidactorSettings'

export class DidactedLinkLine extends LinkLineImplementation {

    public static getSuperClass(): typeof LinkLineImplementation {
        return Object.getPrototypeOf(DidactedLinkLine.prototype).constructor
    }

    public formInnerHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, draggingInProgress: boolean, hoveringOver: boolean): Promise<string> {
        if (this.shouldBeVisible()) {
            return super.formInnerHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress, hoveringOver)
        }
        return Promise.resolve('')
    }

    private shouldBeVisible(): boolean {
        if (this.referenceLink.isHighlight()) {
            return true
        }

        const tagNames: string[]|undefined = this.referenceLink.getData().tags

        const mode: LinkAppearanceMode = linkDidactorSettings.getComputedModeForLinkTags(tagNames)
        switch (mode) {
            case 'visible':
                return true

            case 'visibleEnds':
                return false

            default:
                util.logWarning(`Unexpected LinkTagMode ${mode}`) // should also never be called if link is 'notRendered' at all
                return true
        }
    }
}