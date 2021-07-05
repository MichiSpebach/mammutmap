import { dom } from '../domAdapter'
import { BoxHeader } from './BoxHeader'
import { Box } from './Box'

export class FolderBoxHeader extends BoxHeader {

  public constructor(referenceBox: Box) {
    super(referenceBox)
  }

  public async render(): Promise<void> {
    await super.render()
    dom.addClassTo(super.getId(), 'folderBoxHeader')
  }

}
