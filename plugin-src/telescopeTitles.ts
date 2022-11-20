import { applicationMenu, MenuItemFile, BoxHeader, Box } from '../dist/pluginFacade'
import { util } from '../dist/util'

const deactivateMenuItem: MenuItemFile = new MenuItemFile({label: 'deactivate', click: deactivate})
const activateMenuItem: MenuItemFile = new MenuItemFile({label: 'activate', click: activate})
applicationMenu.addMenuItemTo('telescopeTitles.js', deactivateMenuItem)
applicationMenu.addMenuItemTo('telescopeTitles.js', activateMenuItem)

async function deactivate(): Promise<void> {
    TelescopeBoxHeader.deactivateAndPlugout()
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, false)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, true)
    util.logInfo('deactivated telescopeTitles plugin')
}

async function activate(): Promise<void> {
    TelescopeBoxHeader.activateAndPlugin()
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, true)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, false)
    util.logInfo('activated telescopeTitles plugin')
}

class TelescopeBoxHeader extends BoxHeader {

  private static formTitleHtmlBackup: () => string

  public static activateAndPlugin(): void {
      this.formTitleHtmlBackup = BoxHeader.prototype.formTitleHtml
      BoxHeader.prototype.formTitleHtml = TelescopeBoxHeader.prototype.formTitleHtml
  }

  public static deactivateAndPlugout(): void {
      BoxHeader.prototype.formTitleHtml = TelescopeBoxHeader.formTitleHtmlBackup
  }

  /*public constructor(referenceBox: Box) {
    super(referenceBox)
  }*/

  public static getSuperClass(): typeof BoxHeader {
      return Object.getPrototypeOf(TelescopeBoxHeader.prototype).constructor
  }

  public formTitleHtml(): string {
    let title: string = this.referenceBox.getName()
    let parts: string[] = []
    while (true) {
      let index: number = title.substring(1).search(/[A-Z._/\\]/)+1
      if (index > 0) {
        if (!title.charAt(index).match(/[A-Z]/)) {
          index++
        }
        parts.push(title.substring(0, index))
        title = title.substring(index)
      } else {
        parts.push(title)
        break
      }
    }
    const html: string = parts.map(part => `<span style="text-overflow:ellipsis;overflow:hidden;">${part}</span>`).join('')
    return `<div style="display:flex;">${html}</div>`
  }
}

activate()
