import * as util from './util'
import { Box } from "./Box"

export class FileBox extends Box {

  public constructor(parent: Box, name: string, id: string) {
    super(parent, name, id)
  }

  protected getBorderStyle(): string {
    return 'border:solid;border-color:skyblue;'
  }

  protected renderBody(): void {
    util.readFile(super.getPath(), (dataConvertedToHtml: string) => {
      let content: string = '<pre style="margin:0px;">' + dataConvertedToHtml + '</pre>'
      util.addContentTo(super.getId(), content)
    })
  }

}
