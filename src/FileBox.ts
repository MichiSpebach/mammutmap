import * as util from './util'
import { Box } from "./Box"

export class FileBox extends Box {

  public constructor(parent: Box, name: string, id: string) {
    super(parent, name, id)
  }

  public render(widthInPercent: number, heightInPercent: number):void {
    super.setWidthInPercent(widthInPercent)
    super.setHeightInPercent(heightInPercent)
    util.readFile(this.getPath(), (dataConvertedToHtml: string) => {
      this.renderDiv(dataConvertedToHtml)
    })
  }

  private renderDiv(content: string):void {
    let basicStyle: string = 'display:inline-block;overflow:auto;'
    let scaleStyle: string = 'width:' + super.getWidthInPercent() + '%;height:' + super.getHeightInPercent() + '%;'
    let borderStyle: string = 'border:solid;border-color:skyblue;'
    util.setStyleTo(super.getId(), basicStyle + scaleStyle + borderStyle)

    let nameElement: string = '<div style="background-color:skyblue;">' + super.getName() + '</div>'
    let contentElement: string = '<pre style="margin:0px;">' + content + '</pre>'
    util.setContentTo(super.getId(), nameElement + contentElement)
  }

}
