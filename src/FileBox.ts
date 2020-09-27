import * as util from './util'
import { Box } from "./Box"

export class FileBox extends Box {

  public constructor(parent: Box, name: string, id: string) {
    super(parent, name, id)
  }

  public render(widthInPercent: number, heightInPercent: number): void { // TODO: move to super
    super.setWidthInPercent(widthInPercent)
    super.setHeightInPercent(heightInPercent)

    this.renderStyle()
    super.renderHeader()
    this.renderBody()
  }

  private renderStyle(): void { // TODO: move to super
    let basicStyle: string = 'display:inline-block;overflow:auto;'
    let scaleStyle: string = 'width:' + super.getWidthInPercent() + '%;height:' + super.getHeightInPercent() + '%;'
    let borderStyle: string = 'border:solid;border-color:skyblue;'

    util.setStyleTo(super.getId(), basicStyle + scaleStyle + borderStyle)
  }

  private renderBody(): void {
    util.readFile(this.getPath(), (dataConvertedToHtml: string) => {
      let content: string = '<pre style="margin:0px;">' + dataConvertedToHtml + '</pre>'
      util.addContentTo(super.getId(), content)
    })
  }

}
