import * as util from './util'
import { Box } from "./Box"

export class FileBox {
  private parent: Box
  private name: string
  private id: string
  private widthInPercent: number
  private heightInPercent: number

  public constructor(parent: Box, name: string, id: string, widthInPercent: number, heightInPercent: number) {
    this.parent = parent
    this.name = name
    this.id = id
    this.widthInPercent = widthInPercent
    this.heightInPercent = heightInPercent
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
    let basicStyle: string = 'display:inline-block;overflow:auto;'
    let scaleStyle:string = 'width:' + this.widthInPercent + '%;height:' + this.heightInPercent + '%;'
    let borderStyle:string = 'border:solid;border-color:skyblue;'
    util.setStyleTo(this.id, basicStyle + scaleStyle + borderStyle)

    let nameElement: string = '<div style="background-color:skyblue;">' + this.name + '</div>'
    let contentElement: string = '<pre style="margin:0px;">' + content + '</pre>'
    util.setContentTo(this.id, nameElement + contentElement)
  }

}
