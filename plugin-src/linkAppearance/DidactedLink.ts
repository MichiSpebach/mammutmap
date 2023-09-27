import { WayPointData } from '../../dist/pluginFacade'
import { LinkAppearanceMode } from '../../dist/pluginFacade'
import { NodeWidget } from '../../dist/pluginFacade'
import { Box, LinkImplementation } from '../../dist/pluginFacade'
import { renderManager, RenderPriority } from '../../dist/pluginFacade'
import * as linkAppearanceSettings from './linkAppearanceSettings'

export class DidactedLink extends LinkImplementation {
    private currentStyle: string|null = null
    private styleTimer: NodeJS.Timeout|null = null

    public static getSuperClass(): typeof LinkImplementation {
        return Object.getPrototypeOf(DidactedLink.prototype).constructor
    }

    public override async render(priority?: RenderPriority): Promise<void> {
        if (this.getMode() === 'notRendered') {
            return super.unrender()
        }

        await Promise.all([
            this.updateStyle(priority), // called before super.render() to avoid rendering for short time if hidden
            super.render(priority)
        ])
    }

    public override async unrender(): Promise<void> {
        this.clearStyleTimer()
        await super.unrender()
    }

    public getMode(): LinkAppearanceMode {
        return linkAppearanceSettings.getComputedModeForLinkTags(this.getTags())
    }

    public override getColor(): string {
        const color: string = linkAppearanceSettings.getComputedColorForLinkTags(this.getTags())

        if (color === linkAppearanceSettings.boxIdHashColorName) {
            return this.getColorByToBoxIdHash()
        }

        return color
    }

    private getColorByToBoxIdHash() : string {
        let toBoxId: string
        const dropTargetIfRenderInProgress: Box|NodeWidget|null = this.getTo().getDropTargetIfRenderInProgress()
        if (dropTargetIfRenderInProgress) {
            toBoxId = dropTargetIfRenderInProgress.getId()
        } else {
            const path: WayPointData[] = this.getData().to.path
            toBoxId = path[path.length-1].boxId
        }
        
        const hash: number = toBoxId.charCodeAt(0) + toBoxId.charCodeAt(toBoxId.length/2) + toBoxId.charCodeAt(toBoxId.length-1)
        return linkAppearanceSettings.linkColors[hash % linkAppearanceSettings.linkColors.length]
    }

    private async updateStyle(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
        let style: string = '';
    
        const firstCall: boolean = !this.currentStyle
        const hideTransitionDurationInMs = 1000
        let startDisplayNoneTimer: boolean = false
        if (this.getMode() === 'hidden') {
          if (this.isHighlight()) {
            style = 'opacity:0.5;'
          } else if (firstCall) {
            style = 'display:none;'
          } else {
            startDisplayNoneTimer = true
            style = 'transition-duration:'+hideTransitionDurationInMs+'ms;opacity:0;'
          }
        }
    
        if (this.currentStyle === style) {
          return
        }
        this.currentStyle = style
    
        this.clearStyleTimer()
        if (startDisplayNoneTimer) {
          this.styleTimer = setTimeout(() => {
            renderManager.addStyleTo(this.getId(), 'display:none;', priority)
            this.styleTimer = null
          }, hideTransitionDurationInMs)
        }
    
        if (!firstCall || style !== '') {
          await renderManager.addStyleTo(this.getId(), style, priority)
        }
    }

    private clearStyleTimer() {
        if (this.styleTimer) {
            clearTimeout(this.styleTimer)
            this.styleTimer = null
        }
    }

}