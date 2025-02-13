import { renderManager } from '../renderEngine/renderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu'
import { Box } from './Box'
import { BoxHeader } from './header/BoxHeader'
import { SourcelessBoxHeader } from './header/SourcelessBoxHeader'
import { FolderBox } from './FolderBox'
import { BoxData } from '../mapData/BoxData'
import { BoxLinks } from './BoxLinks'
import { ClientPosition } from '../shape/ClientPosition'
import { BoxContext } from './BoxContext'
import { RenderElements } from '../renderEngine/RenderElement'
import { log } from '../logService'

type SourcelessBoxType = 'source not found'|'unknown source type'

export class SourcelessBox extends Box {
  private readonly type: SourcelessBoxType
  private bodyRendered: boolean = false

  public constructor(name: string, parent: FolderBox, mapData: BoxData, mapDataFileExists: boolean, type: SourcelessBoxType, context?: BoxContext) {
    super(name, parent, mapData, mapDataFileExists, context)
    this.type = type
  }

  protected createHeader(): BoxHeader {
    return new SourcelessBoxHeader(this)
  }

  public isFolder(): boolean {
    return false
  }

  public isFile(): boolean {
    return false
  }

  public isSourceless(): boolean {
    return true
  }

  protected getBodyOverflowStyle(): 'hidden' | 'visible' {
    return 'hidden'
  }

  protected getBackgroundStyleClass(): string {
    return style.getSourcelessBoxBackgroundClass()
  }

  protected async renderAdditional(): Promise<void> {
    if (this.isRendered()) {
      return
    }
    await renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForSourcelessBox(this, new ClientPosition(clientX, clientY)))
  }

  protected async unrenderAdditional(): Promise<void> {
    if (!this.isRendered()) {
      return
    }
    await renderManager.removeEventListenerFrom(this.getId(), 'contextmenu')
  }

  protected getBodyId(): string {
    return this.getId()+'Body'
  }

  protected async renderBody(): Promise<void> {
    await renderManager.setElementTo(this.getBodyId(), {
      type: 'div',
      style: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100%'
      },
      children: {
        type: 'div', // wrapper only to make centering work
        children: this.buildBodyChildren()
      }
    })
    this.bodyRendered = true
  }

  private buildBodyChildren(): RenderElements {
    if (this.type === 'source not found') {
      return [
        {type: 'div', children: 'Source not found, maybe it was moved or renamed.'},
        {type: 'div', children: 'Drag to other box or drop other box here to fuse. (coming soon)'}, // TODO: implement
        {type: 'button', onclick: () => log.warning('Autofix is not implemented yet.'), children: 'Autofix (coming soon)'} // TODO: implement
      ]
    }

    if (this.type === 'unknown source type') {
      return 'Neither file nor directory.'
    }

    log.warning(`Unknown SourcelessBoxType '${this.type}' in '${this.getName()}'.`)
    return `Unknown SourcelessBoxType '${this.type}'.`
  }

  protected async unrenderBodyIfPossible(force?: boolean): Promise<{ rendered: boolean; }> {
    await renderManager.setContentTo(this.getBodyId(), '')
    this.bodyRendered = false
    return {rendered: false}
  }

  public isBodyRendered(): boolean {
    return this.bodyRendered
  }

  public isBodyBeingRendered(): boolean {
    return this.bodyRendered // TODO: this is not always correct, add generic ${public readonly body: BoxBody} to Box and remove implementation in subclasses of Box
  }

  public getInnerLinksRecursive(): BoxLinks[] {
    return [this.links]
  }

}
