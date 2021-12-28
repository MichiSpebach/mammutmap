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

  private getContentId(): string {
    return this.getId()+'Content'
  }

  public async executeRender(): Promise<void> {
    if (this.isRendered()) {
      return
    }

    const dataConvertedToHtml: string = await fileSystem.readFileAndConvertToHtml(this.referenceFileBox.getSrcPath())
    const content: string = `<pre id="${this.getContentId()}" style="margin:0px;">${dataConvertedToHtml}</pre>`
    return renderManager.setContentTo(this.getId(), content)
  }

  public async executeUnrenderIfPossible(): Promise<{rendered: boolean}> {
    if (!this.isRendered()) {
      return {rendered: false}
    }
    await renderManager.remove(this.getContentId())
    return {rendered: false}
  }

}
