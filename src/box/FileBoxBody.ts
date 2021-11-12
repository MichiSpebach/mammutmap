import * as fileSystem from '../fileSystemAdapter'
import { renderManager } from '../RenderManager'
import { BoxBody } from './BoxBody'
import { FileBox } from './FileBox'

export class FileBoxBody extends BoxBody {
  private readonly referenceFileBox: FileBox

  public constructor(referenceBox: FileBox) {
    super(referenceBox)
    this.referenceFileBox = referenceBox
  }

  public async executeRender(): Promise<void> {
    if (this.isRendered()) {
      return
    }

    fileSystem.readFileAndConvertToHtml(this.referenceFileBox.getSrcPath(), async (dataConvertedToHtml: string) => {
      let content: string = '<pre id="'+this.getId()+'" style="margin:0px;">'+dataConvertedToHtml+'</pre>'
      return renderManager.addContentTo(this.referenceFileBox.getId(), content)
    })
  }

  public async executeUnrender(): Promise<void> {
    if (!this.isRendered()) {
      return
    }
    await renderManager.remove(this.getId())
  }

}
