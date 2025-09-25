import { applicationMenu, MenuItemFile } from '../dist/pluginFacade'
import { coreUtil } from '../dist/pluginFacade'
import { dom } from '../dist/core/renderEngine/domAdapter'
import { style } from '../dist/pluginFacade'
import { BorderingLinks } from '../dist/pluginFacade'
import { LinkHighlight } from '../dist/core/link/LinkHighlights'

const deactivateMenuItem: MenuItemFile = new MenuItemFile({label: 'deactivate', click: deactivate, enabled: false})
const activateMenuItem: MenuItemFile = new MenuItemFile({label: 'activate', click: activate})
applicationMenu.addMenuItemTo('fancyHighlighting.js', deactivateMenuItem)
applicationMenu.addMenuItemTo('fancyHighlighting.js', activateMenuItem)

let activated: boolean = false
let highlightLinkFilterPropertyValueBefore: string | undefined
const highlightLinkFilterPropertyValueFancy: string = 'contrast(0.5) brightness(1.2) drop-shadow(0 0 3px white)'

async function deactivate(): Promise<void> {
    ToggableFancyBorderingLinks.deactivateAndPlugout()
    await ensureDeactivation()
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, false)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, true)
    coreUtil.logInfo('deactivated fancyHighlighting plugin')
}

async function activate(): Promise<void> {
    ToggableFancyBorderingLinks.activateAndPlugin()
    await ensureActivation()
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, true)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, false)
    coreUtil.logInfo('activated fancyHighlighting plugin')
}

async function ensureDeactivation(): Promise<void> {
    if (!activated || !highlightLinkFilterPropertyValueBefore) {
        return
    }
    await dom.modifyCssRule('.'+style.getHighlightLinkBrightClass(), 'filter', highlightLinkFilterPropertyValueBefore)
    highlightLinkFilterPropertyValueBefore = undefined
    activated = false
}

async function ensureActivation(): Promise<void> {
    if (activated) {
        return
    }
    const result = await dom.modifyCssRule('.'+style.getHighlightLinkBrightClass(), 'filter', highlightLinkFilterPropertyValueFancy)
    if (!highlightLinkFilterPropertyValueBefore) {
        highlightLinkFilterPropertyValueBefore = result.propertyValueBefore
    }
    activated = true
}

class ToggableFancyBorderingLinks extends BorderingLinks {

    private static addHighlightToAllThatShouldBeRenderedBackup: (highlight: LinkHighlight) => Promise<void>
    private static removeHighlightFromAllThatShouldBeRenderedBackup: (highlightHandle: string) => Promise<void>

    public static activateAndPlugin(): void {
        this.addHighlightToAllThatShouldBeRenderedBackup = BorderingLinks.prototype.addHighlightToAllThatShouldBeRendered
        BorderingLinks.prototype.addHighlightToAllThatShouldBeRendered = ToggableFancyBorderingLinks.prototype.addHighlightToAllThatShouldBeRendered
        this.removeHighlightFromAllThatShouldBeRenderedBackup = BorderingLinks.prototype.removeHighlightFromAllThatShouldBeRendered
        BorderingLinks.prototype.removeHighlightFromAllThatShouldBeRendered = ToggableFancyBorderingLinks.prototype.removeHighlightFromAllThatShouldBeRendered
    }

    public static deactivateAndPlugout(): void {
        BorderingLinks.prototype.addHighlightToAllThatShouldBeRendered = ToggableFancyBorderingLinks.addHighlightToAllThatShouldBeRenderedBackup
        BorderingLinks.prototype.addHighlightToAllThatShouldBeRendered = ToggableFancyBorderingLinks.addHighlightToAllThatShouldBeRenderedBackup
    }

    public override async addHighlightToAllThatShouldBeRendered(highlight: LinkHighlight): Promise<void> {
        if (this.getLinksThatShouldBeRendered().length > 15) {
            await ensureDeactivation()
        } else {
            await ensureActivation()
        }
        return ToggableFancyBorderingLinks.addHighlightToAllThatShouldBeRenderedBackup.call(this, highlight)
    }

    public override async removeHighlightFromAllThatShouldBeRendered(highlightHandle: string): Promise<void> {
        if (this.getLinksThatShouldBeRendered().length > 15) {
            await ensureDeactivation()
        } else {
            await ensureActivation()
        }
        return ToggableFancyBorderingLinks.removeHighlightFromAllThatShouldBeRenderedBackup.call(this, highlightHandle)
    }

}
