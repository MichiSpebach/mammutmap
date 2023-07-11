import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu'
import { Box } from './Box'
import { BoxData } from '../mapData/BoxData'
import { FolderBox } from './FolderBox'
import { FileBoxHeader } from './FileBoxHeader'
import { FileBoxBody } from './FileBoxBody'
import { BoxLinks } from './BoxLinks'
import { ClientPosition } from '../shape/ClientPosition'
import { BoxContext } from './BoxContext'

export class FileBox extends Box {
  private readonly body: FileBoxBody

  public constructor(name: string, parent: FolderBox, mapData: BoxData, mapDataFileExists: boolean, context: BoxContext) {
    super(name, parent, mapData, mapDataFileExists, context)
    this.body = new FileBoxBody(this)
  }

  protected createHeader(): FileBoxHeader {
    return new FileBoxHeader(this)
  }

  public isFolder(): boolean {
    return false
  }

  public isFile(): boolean {
    return true
  }

  public isSourceless(): boolean {
    return false
  }

  protected getAdditionalStyle(): null {
    return null
  }

  protected getBodyOverflowStyle(): 'auto'|'hidden'|'visible' {
    return 'auto'
  }

  protected getBackgroundStyleClass(): string {
    return style.getFileBoxBackgroundClass()
  }

  protected async renderAdditional(): Promise<void> {
    if (this.isRendered()) {
      return
    }
    await renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForFileBox(this, new ClientPosition(clientX, clientY)))
  }

  protected async unrenderAdditional(): Promise<void> {
    if (!this.isRendered()) {
      return
    }
    await renderManager.removeEventListenerFrom(this.getId(), 'contextmenu')
  }

  public getBody(): FileBoxBody {
    return this.body
  }

  protected getBodyId(): string {
    return this.body.getId()
  }

  protected async renderBody(): Promise<void> {
    await this.body.render()
  }

  protected async unrenderBodyIfPossible(): Promise<{rendered: boolean}> {
    return this.body.unrenderIfPossible()
  }

  public isBodyRendered(): boolean {
    return this.body.isRendered()
  }

  public isBodyBeingRendered(): boolean {
    return this.body.isBeingRendered()
  }

  public getInnerLinksRecursive(): BoxLinks[] {
    return [this.links]
  }

}
