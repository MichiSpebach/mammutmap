import { LocalPosition } from '../../dist/pluginFacade'
import { LinkLineImplementation } from '../../dist/pluginFacade'
import { LinkAppearanceMode } from '../../dist/pluginFacade'
import { coreUtil } from '../../dist/pluginFacade'
import * as linkAppearanceSettings from './linkAppearanceSettings'

export class DidactedLinkLine extends LinkLineImplementation {

    public static getSuperClass(): typeof LinkLineImplementation {
        return Object.getPrototypeOf(DidactedLinkLine.prototype).constructor
    }

    public override formInnerHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, draggingInProgress: boolean, hoveringOver: boolean, selected: boolean): Promise<string> {
        if (this.shouldBeVisible()) {
            return super.formInnerHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress, hoveringOver, selected)
        }
        return Promise.resolve('')
    }

    private shouldBeVisible(): boolean {
        if (this.referenceLink.isHighlight()) {
            return true
        }

        const tagNames: string[]|undefined = this.referenceLink.getData().tags

        const mode: LinkAppearanceMode = linkAppearanceSettings.getComputedModeForLinkTags(tagNames)
        switch (mode) {
            case 'visible':
                return true

            case 'visibleEnds':
                return false // TODO: implement smooth disappearing like for 'hidden' as well

            case 'hidden':
                return true // sometimes visible because of smooth disappearing

            default:
                coreUtil.logWarning(`Unexpected LinkTagMode ${mode}`) // should also never be called if link is 'notRendered' at all
                return true
        }
    }
}