import { applicationMenu, MenuItemFile } from '../dist/pluginFacade'
import { coreUtil } from '../dist/pluginFacade'
import { dom } from '../dist/core/domAdapter'
import { style } from '../dist/pluginFacade'
import { BorderingLinks } from '../dist/pluginFacade'

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
    await dom.modifyCssRule('.'+style.getHighlightLinkClass(), 'filter', highlightLinkFilterPropertyValueBefore)
    highlightLinkFilterPropertyValueBefore = undefined
    activated = false
}

async function ensureActivation(): Promise<void> {
    if (activated) {
        return
    }
    const result = await dom.modifyCssRule('.'+style.getHighlightLinkClass(), 'filter', highlightLinkFilterPropertyValueFancy)
    if (!highlightLinkFilterPropertyValueBefore) {
        highlightLinkFilterPropertyValueBefore = result.propertyValueBefore
    }
    activated = true
}

class ToggableFancyBorderingLinks extends BorderingLinks {

    private static setHighlightAllBackup: (highlight: boolean) => Promise<void>

    public static activateAndPlugin(): void {
        this.setHighlightAllBackup = BorderingLinks.prototype.setHighlightAll
        BorderingLinks.prototype.setHighlightAll = ToggableFancyBorderingLinks.prototype.setHighlightAll
    }

    public static deactivateAndPlugout(): void {
        BorderingLinks.prototype.setHighlightAll = ToggableFancyBorderingLinks.setHighlightAllBackup
    }

    public override async setHighlightAll(highlight: boolean): Promise<void> {
        if (this.links.length > 15) {
            await ensureDeactivation()
        } else {
            await ensureActivation()
        }
        return ToggableFancyBorderingLinks.setHighlightAllBackup.call(this, highlight)
    }

}
