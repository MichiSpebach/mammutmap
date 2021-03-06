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

  public isSourceless(): boolean {
    return false
  }

  protected getAdditionalStyle(): null {
    return null
  }

  protected getBodyOverflowStyle(): 'hidden'|'visible' {
    return 'hidden'
  }

  protected getBackgroundStyleClass(): string {
    return style.getFileBoxBackgroundClass()
  }

  protected async renderAdditional(): Promise<void> {
    if (this.isRendered()) {
      return
    }
    await renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForFileBox(this, clientX, clientY))
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

}
