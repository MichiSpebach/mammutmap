import * as dom from '../domAdapter'
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

    dom.addClassTo(super.getId(), style.getFolderBoxClass())
    dom.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForFileBox(this, clientX, clientY))
  }

  protected async renderBody(): Promise<void> {
    this.body.render()
  }

  public isBodyRendered(): boolean {
    return this.body.isRendered()
  }

}
