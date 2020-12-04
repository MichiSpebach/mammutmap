import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { BoxMapData } from './BoxMapData'
import { Rect } from '../Rect'
//import { ScaleManager } from '../ScaleManager'

export class BoxBorder {
  private readonly referenceBox: Box // TODO: use interface instead?

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public render(): Promise<void> {
    const top: string = this.formLine('width:100%;height:2px;top:0px;')
    const bottom: string = this.formLine('width:100%;height:2px;bottom:0px;')
    const right: string = this.formLine('width:2px;height:100%;top:0px;right:0px;')
    const left: string = this.formLine('width:2px;height:100%;top:0px;')
    return dom.addContentTo(this.referenceBox.getId(), top + bottom + right + left)
  }

  private formLine(sizeAndPositionStyle: string): string {
    return '<div style="position:absolute;' + sizeAndPositionStyle + 'background-color:lightskyblue;"></div>'
  }

}
