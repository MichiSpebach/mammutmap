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

    const dataConvertedToHtml: string = await fileSystem.readFileAndConvertToHtml(this.referenceFileBox.getSrcPath())
    const content: string = `<pre id="${this.getId()}" style="margin:0px;">${dataConvertedToHtml}</pre>`
    return renderManager.addContentTo(this.referenceFileBox.getId(), content)
  }

  public async executeUnrenderIfPossible(): Promise<{rendered: boolean}> {
    if (!this.isRendered()) {
      return {rendered: false}
    }
    await renderManager.remove(this.getId())
    return {rendered: false}
  }

}
