import { applicationMenu } from '../dist/applicationMenu'
import { MenuItem } from 'electron'
import { util } from '../dist/util'
import { dom } from '../dist/domAdapter'
import { style } from '../dist/styleAdapter'
import { BorderingLinks } from '../dist/link/BorderingLinks'

const deactivateMenuItem: MenuItem = new MenuItem({label: 'deactivate', click: deactivate})
const activateMenuItem: MenuItem = new MenuItem({label: 'activate', click: activate})
applicationMenu.addMenuItemTo('fancyHighlighting.js', deactivateMenuItem)
applicationMenu.addMenuItemTo('fancyHighlighting.js', activateMenuItem)

let activated: boolean = false
let highlightLinkFilterPropertyValueBefore: string | undefined
const highlightLinkFilterPropertyValueFancy: string = 'contrast(0.5) brightness(1.2) drop-shadow(0 0 3px white)'

async function deactivate(): Promise<void> {
    ToggableFancyBorderingLinks.deactivateAndPlugout()
    await ensureDeactivation()
    deactivateMenuItem.enabled = false
    activateMenuItem.enabled = true
    util.logInfo('deactivated fancyHighlighting plugin')
}

async function activate(): Promise<void> {
    ToggableFancyBorderingLinks.activateAndPlugin()
    await ensureActivation()
    deactivateMenuItem.enabled = true
    activateMenuItem.enabled = false
    util.logInfo('activated fancyHighlighting plugin')
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

    public async setHighlightAll(highlight: boolean): Promise<void> {
        if (this.links.length > 15) {
            await ensureDeactivation()
        } else {
            await ensureActivation()
        }
        return ToggableFancyBorderingLinks.setHighlightAllBackup.call(this, highlight)
    }

}

activate()