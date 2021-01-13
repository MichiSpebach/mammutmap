import * as fileSystem from '../fileSystemAdapter'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { FolderBox } from './FolderBox'
import { FileBoxHeader } from './FileBoxHeader'

export class FileBox extends Box {

  public constructor(id: string, name: string, parent: FolderBox) {
    super(id, name, parent)
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

  protected async renderBody(): Promise<void> {
    fileSystem.readFileAndConvertToHtml(super.getSrcPath(), (dataConvertedToHtml: string) => {
      let content: string = '<pre style="margin:0px;">' + dataConvertedToHtml + '</pre>'
      dom.addContentTo(super.getId(), content)
    })
  }

}
