import * as util from './util'
import { Box } from "./Box"

export class FileBox {
  private parent: Box
  private name: string
  private id: string
  private targetWidth: number
  private targetHeight: number

  public constructor(parent: Box, name: string, id: string) {
    this.parent = parent
    this.name = name
    this.id = id
  }

  public getPath(): string {
    return this.parent.getPath() + '/' + this.name
  }

  public render():void {
    util.readFile(this.getPath(), (dataConvertedToHtml: string) => {
      this.renderDiv(dataConvertedToHtml)
    })
  }

  private renderDiv(content: string):void {
    let preformattedContent: string = '<pre style="margin:0px">' + content + '</pre>'
    let contentDivision: string = '<div style="border:solid;border-color:skyblue">' + preformattedContent + '</div>'
    util.setContentTo(this.id, this.name + contentDivision)
  }

}
