import { applicationMenu, MenuItemFile, BoxHeader, Box } from '../dist/pluginFacade'
import { coreUtil } from '../dist/pluginFacade'

const deactivateMenuItem: MenuItemFile = new MenuItemFile({label: 'deactivate', click: deactivate})
const activateMenuItem: MenuItemFile = new MenuItemFile({label: 'activate', click: activate})
applicationMenu.addMenuItemTo('telescopeTitles.js', deactivateMenuItem)
applicationMenu.addMenuItemTo('telescopeTitles.js', activateMenuItem)

async function deactivate(): Promise<void> {
    TelescopeBoxHeader.deactivateAndPlugout()
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, false)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, true)
    coreUtil.logInfo('deactivated telescopeTitles plugin')
}

async function activate(): Promise<void> {
    TelescopeBoxHeader.activateAndPlugin()
    await applicationMenu.setMenuItemEnabled(deactivateMenuItem, true)
    await applicationMenu.setMenuItemEnabled(activateMenuItem, false)
    coreUtil.logInfo('activated telescopeTitles plugin')
}

class TelescopeBoxHeader extends BoxHeader {

  private static formTitleHtmlBackup: () => string
  private static formTitleHtmlSplitInMiddleBackup: () => string
  private static formTitleHtmlSplitBetweenWordsBackup: () => string
  private static splitInMiddleBackup: (text: string) => {left: string, right: string}
  private static splitBetweenWordsBackup: (text: string) => string[]

  public static activateAndPlugin(): void {
      //const swap = BoxHeader.prototype
      //console.log(TelescopeBoxHeader.getSuperClass())
      //Object.setPrototypeOf(TelescopeBoxHeader.getSuperClass().prototype, null)
      //Object.setPrototypeOf(BoxHeader.prototype, TelescopeBoxHeader.prototype)
      //Object.setPrototypeOf(TelescopeBoxHeader.getSuperClass(), swap)
      this.formTitleHtmlBackup = BoxHeader.prototype.formTitleHtml
      BoxHeader.prototype.formTitleHtml = TelescopeBoxHeader.prototype.formTitleHtml
      ;(BoxHeader.prototype as any).splitInMiddle = TelescopeBoxHeader.prototype.splitInMiddle
      ;(BoxHeader.prototype as any).formTitleHtmlSplitInMiddle = TelescopeBoxHeader.prototype.formTitleHtmlSplitInMiddle
      ;(BoxHeader.prototype as any).formTitleHtmlSplitBetweenWords = TelescopeBoxHeader.prototype.formTitleHtmlSplitBetweenWords
      ;(BoxHeader.prototype as any).splitBetweenWords = TelescopeBoxHeader.prototype.splitBetweenWords
  }

  public static deactivateAndPlugout(): void {
      BoxHeader.prototype.formTitleHtml = TelescopeBoxHeader.formTitleHtmlBackup
      ;(BoxHeader.prototype as any).splitInMiddle = TelescopeBoxHeader.splitInMiddleBackup
      ;(BoxHeader.prototype as any).formTitleHtmlSplitInMiddle = TelescopeBoxHeader.formTitleHtmlSplitInMiddleBackup
      ;(BoxHeader.prototype as any).formTitleHtmlSplitBetweenWords = TelescopeBoxHeader.formTitleHtmlSplitBetweenWordsBackup
      ;(BoxHeader.prototype as any).splitBetweenWords = TelescopeBoxHeader.splitBetweenWordsBackup
  }

  /*public constructor(referenceBox: Box) {
    super(referenceBox)
  }*/

  public static getSuperClass(): typeof BoxHeader {
      return Object.getPrototypeOf(TelescopeBoxHeader.prototype).constructor
  }

  public formTitleHtml(): string {
    return this.formTitleHtmlSplitInMiddle()
  }

  private formTitleHtmlSplitInMiddle(): string {
    const parts: {left: string, right: string} = this.splitInMiddle(this.referenceBox.getName())
    let html: string = `<span style="white-space:nowrap;text-overflow:ellipsis;overflow:hidden;">${parts.left}</span>`
    html += `<span style="overflow:hidden;"><span style="white-space:nowrap;float:right;">${parts.right}</span></span>`
    return `<div style="display:flex;">${html}</div>`
  }

  public formTitleHtmlSplitBetweenWords(): string {
    const parts: string[] = this.splitBetweenWords(this.referenceBox.getName())
    const html: string = parts.map(part => `<span style="text-overflow:ellipsis;overflow:hidden;">${part}</span>`).join('')
    return `<div style="display:flex;">${html}</div>`
  }

  private splitInMiddle(text: string): {left: string, right: string} {
    const splitIndex: number = text.length/2
    return {
      left: text.substring(0, splitIndex), 
      right: text.substring(splitIndex)
    }
  }

  private splitBetweenWords(text: string): string[] {
    let parts: string[] = []
    while (true) {
      let index: number = text.substring(1).search(/[A-Z._\-/\\\s]/)+1
      if (index > 0) {
        if (!text.charAt(index).match(/[A-Z]/)) {
          index++
        }
        parts.push(text.substring(0, index))
        text = text.substring(index)
      } else {
        parts.push(text)
        break
      }
    }
    return parts
  }
}

activate()
