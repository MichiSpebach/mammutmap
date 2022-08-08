import * as applicationMenu from '../dist/applicationMenu'
import { MenuItem } from 'electron'
import { util } from '../dist/util'
import { dom } from '../dist/domAdapter'
import { style } from '../dist/styleAdapter'

const deactivateMenuItem: MenuItem = new MenuItem({label: 'deactivate', click: deactivate})
const activateMenuItem: MenuItem = new MenuItem({label: 'activate', click: activate})
applicationMenu.addMenuItemTo('fancyHighlighting.js', deactivateMenuItem)
applicationMenu.addMenuItemTo('fancyHighlighting.js', activateMenuItem)

let highlightLinkFilterPropertyValueBefore: string | undefined
const highlightLinkFilterPropertyValueFancy: string = 'contrast(0.5) brightness(1.2) drop-shadow(0 0 3px white)'

async function deactivate(): Promise<void> {
    if (!highlightLinkFilterPropertyValueBefore) {
        let message: string = 'failed to deactivate fancyHighlighting plugin'
        message += ', because highlightLinkFilterPropertyValueBefore is not set, this should never happen.'
        util.logWarning(message)
        return
    }
    await dom.modifyCssRule('.'+style.getHighlightLinkClass(), 'filter', highlightLinkFilterPropertyValueBefore)
    highlightLinkFilterPropertyValueBefore = undefined
    deactivateMenuItem.enabled = false
    activateMenuItem.enabled = true
    util.logInfo('deactivated fancyHighlighting plugin')
}

async function activate(): Promise<void> {
    const result = await dom.modifyCssRule('.'+style.getHighlightLinkClass(), 'filter', highlightLinkFilterPropertyValueFancy)
    highlightLinkFilterPropertyValueBefore = result.propertyValueBefore
    deactivateMenuItem.enabled = true
    activateMenuItem.enabled = false
    util.logInfo('activated fancyHighlighting plugin')
}

activate()
