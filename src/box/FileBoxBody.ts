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

    const normalizedFileName: string = this.referenceFileBox.getName().toLowerCase()
    try {
      // TODO: make something like this work: getImageType().startsWith('image/')
      if (normalizedFileName.endsWith('.png') || normalizedFileName.endsWith('.jpg') || normalizedFileName.endsWith('.svg')) {
        this.setContent(await this.formHtmlContentForImage())
      } else {
        this.setContent(await this.formHtmlContentForTextFile())
      }
    } catch(e) {
      this.setContent(this.formHtmlContentForError(e))
    }
  }

  private async setContent(content: string): Promise<void> {
    await renderManager.setContentTo(this.getId(), content)
  }

  public async executeUnrenderIfPossible(): Promise<{rendered: boolean}> {
    if (!this.isRendered()) {
      return {rendered: false}
    }
    await renderManager.remove(this.getContentId())
    return {rendered: false}
  }

  private async formHtmlContentForImage(): Promise<string|never> {
    return `<img id="${this.getContentId()}" style="width:100%;" src="${this.referenceFileBox.getSrcPath()}">`
  }

  private async formHtmlContentForTextFile(): Promise<string|never> {
    const dataConvertedToHtml: string = await fileSystem.readFileAndConvertToHtml(this.referenceFileBox.getSrcPath())
    return `<pre id="${this.getContentId()}" style="margin:0px;">${dataConvertedToHtml}</pre>`
  }

  private formHtmlContentForError(errorMessage: string): string {
    return `<div id="${this.getContentId()}" style="color:red;">${errorMessage}</div>`
  }

}
