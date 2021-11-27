import { dom } from '../domAdapter'
import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu'
import { Box } from './Box'
import { BoxMapData } from './BoxMapData'
import { FolderBox } from './FolderBox'
import { FileBoxHeader } from './FileBoxHeader'
import { FileBoxBody } from './FileBoxBody'

export class FileBox extends Box {
  private readonly body: FileBoxBody

  public constructor(name: string, parent: FolderBox, mapData: BoxMapData, mapDataFileExists: boolean) {
    super(name, parent, mapData, mapDataFileExists)
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

  protected getOverflow(): 'hidden' {
    return 'hidden'
  }

  protected getAdditionalStyle(): null {
    return null
  }

  protected async renderAdditional(): Promise<void> {
    if (this.isRendered()) {
      return
    }

    renderManager.addClassTo(super.getId(), style.getFolderBoxClass())
    dom.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForFileBox(this, clientX, clientY))
  }

  protected async unrenderAdditional(): Promise<void> {
    if (!this.isRendered()) {
      return
    }

    dom.removeEventListenerFrom(this.getId(), 'contextmenu')
  }

  protected async renderBody(): Promise<void> {
    await this.body.render()
  }

  protected async unrenderBody(): Promise<void> {
    await this.body.unrender()
  }

  public isBodyRendered(): boolean {
    return this.body.isRendered()
  }

}
