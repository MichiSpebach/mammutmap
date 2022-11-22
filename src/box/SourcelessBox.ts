import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu/contextMenu'
import { Box } from './Box'
import { BoxHeader } from './BoxHeader'
import { SourcelessBoxHeader } from './SourcelessBoxHeader'
import { FolderBox } from './FolderBox'
import { BoxData } from '../mapData/BoxData'
import { BoxLinks } from './BoxLinks'

export class SourcelessBox extends Box {
  private content: string
  private bodyRendered: boolean = false

  public constructor(name: string, parent: FolderBox, mapData: BoxData, mapDataFileExists: boolean, content: string) {
    super(name, parent, mapData, mapDataFileExists)
    this.content = content
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
    return false
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
    await renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForSourcelessBox(this, clientX, clientY))
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
    await renderManager.setContentTo(this.getBodyId(), this.content) // TODO: if source not found 'drag to other box or drop other box here to fuse'
    this.bodyRendered = true
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
