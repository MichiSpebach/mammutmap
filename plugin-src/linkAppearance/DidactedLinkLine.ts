import { LocalPosition, renderManager, RenderPriority, Style } from '../../dist/pluginFacade'
import { LinkLineImplementation } from '../../dist/pluginFacade'
import { LinkAppearanceMode } from '../../dist/pluginFacade'
import { coreUtil } from '../../dist/pluginFacade'
import * as linkAppearanceSettings from './linkAppearanceSettings'

export class DidactedLinkLine extends LinkLineImplementation {
    private additionalStyleAsString: string|null = null
    private styleTimer: NodeJS.Timeout|null = null

    public static getSuperClass(): typeof LinkLineImplementation {
        return Object.getPrototypeOf(DidactedLinkLine.prototype).constructor
    }

    protected override getStyleAsString(): string {
        return super.getStyleAsString() + (this.additionalStyleAsString ?? '')
    }

    public async updateStyle(mode: LinkAppearanceMode, priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        let newAdditionalStyle: Style
        let newAdditionalStyleAsString: string
    
        const firstCall: boolean = this.additionalStyleAsString === null
        const hideTransitionDurationInMs = 1000
        let startDisplayNoneTimer: boolean = false
        if (mode !== 'visibleEnds' || this.referenceLink.isHighlight() || this.referenceLink.isSelected()) {
            newAdditionalStyle = {display: null, opacity: null, transitionDuration: null}
            newAdditionalStyleAsString = ''
        } else {
            if (firstCall) {
                newAdditionalStyle = {display: 'none', opacity: null, transitionDuration: null}
                newAdditionalStyleAsString = 'display:none;'
            } else {
                startDisplayNoneTimer = true
                newAdditionalStyle = {display: null, opacity: '0', transitionDuration: `${hideTransitionDurationInMs}ms`}
                newAdditionalStyleAsString = 'transition-duration:'+hideTransitionDurationInMs+'ms;opacity:0;'
            }
        }
    
        if (this.additionalStyleAsString === newAdditionalStyleAsString) {
            return
        }
        this.additionalStyleAsString = newAdditionalStyleAsString
    
        this.clearStyleTimer()
        if (startDisplayNoneTimer) {
            this.styleTimer = setTimeout(() => {
                renderManager.addStyleTo(this.getId(), {display: 'none', opacity: null, transitionDuration: null}, priority)
                this.styleTimer = null
            }, hideTransitionDurationInMs)
        }
    
        if (!firstCall) {
            await renderManager.addStyleTo(this.getId(), newAdditionalStyle, priority)
        }
    }

    public clearStyleTimer() {
        if (this.styleTimer) {
            clearTimeout(this.styleTimer)
            this.styleTimer = null
        }
    }

    /*public override formInnerHtml(fromInManagingBoxCoords: LocalPosition, toInManagingBoxCoords: LocalPosition, draggingInProgress: boolean, hoveringOver: boolean, selected: boolean): Promise<string> {
        if (this.shouldBeVisible()) {
            return super.formInnerHtml(fromInManagingBoxCoords, toInManagingBoxCoords, draggingInProgress, hoveringOver, selected)
        }
        return Promise.resolve('')
    }*/

    private shouldBeVisible(): boolean {
        if (this.referenceLink.isHighlight() || this.referenceLink.isSelected()) {
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