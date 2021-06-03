import * as fileSystem from '../fileSystemAdapter'
import * as dom from '../domAdapter'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu'
import { Box } from './Box'
import { BoxMapData } from './BoxMapData'
import { FolderBox } from './FolderBox'
import { FileBoxHeader } from './FileBoxHeader'

export class FileBox extends Box {

  public constructor(name: string, parent: FolderBox, mapData: BoxMapData, mapDataFileExists: boolean) {
    super(name, parent, mapData, mapDataFileExists)
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

  public async render(): Promise<void> {
    await super.render()
    dom.addClassTo(super.getId(), style.getFolderBoxClass())
    dom.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForFileBox(this, clientX, clientY))
  }

  protected async renderBody(): Promise<void> {
    fileSystem.readFileAndConvertToHtml(super.getSrcPath(), async (dataConvertedToHtml: string) => {
      let content: string = '<pre style="margin:0px;">' + dataConvertedToHtml + '</pre>'
      return dom.addContentTo(super.getId(), content)
    })
  }

}
