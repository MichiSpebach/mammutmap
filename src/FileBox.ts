import * as util from './util'
import * as dom from './domAdapter'
import { Box } from './Box'
import { Path } from './Path'

export class FileBox extends Box {

  public constructor(path: Path, id: string) {
    super(path, id)
  }

  protected getBorderStyle(): string {
    return 'border:solid;border-color:skyblue;'
  }

  protected renderBody(): void {
    util.readFileAndConvertToHtml(super.getPath().getSrcPath(), (dataConvertedToHtml: string) => {
      let content: string = '<pre style="margin:0px;">' + dataConvertedToHtml + '</pre>'
      dom.addContentTo(super.getId(), content)
    })
  }

}
