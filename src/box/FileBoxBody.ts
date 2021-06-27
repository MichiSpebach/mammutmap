import * as fileSystem from '../fileSystemAdapter'
import * as dom from '../domAdapter'
import { BoxBody } from './BoxBody'
import { FileBox } from './FileBox'

export class FileBoxBody extends BoxBody {
  private readonly referenceFileBox: FileBox
  private rendered: boolean = false

  public constructor(referenceBox: FileBox) {
    super(referenceBox)
    this.referenceFileBox = referenceBox
  }

  public isRendered(): boolean {
    return this.rendered
  }

  public async render(): Promise<void> { // TODO: make sure only one thread is in this method (semaphore)
    if (this.isRendered()) {
      return
    }
    if (! await this.shouldBeRendered()) {
      return
    }

    fileSystem.readFileAndConvertToHtml(this.referenceFileBox.getSrcPath(), async (dataConvertedToHtml: string) => {
      let content: string = '<pre style="margin:0px;">' + dataConvertedToHtml + '</pre>'
      return dom.addContentTo(this.referenceFileBox.getId(), content)
    })

    this.rendered = true
  }

}
