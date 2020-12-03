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
    const top: string = '<rect width="100%" height="2px" style="fill:skyblue;"/>'
    const bottom: string = '<rect width="100%" height="2px" style="fill:skyblue;"/>'
    const right: string = '<rect width="2px" height="100%" style="fill:skyblue;"/>'
    const left: string = '<rect width="2px" height="100%" style="fill:skyblue;"/>' // float right or bottom:0 does not work, seems to be difficult achieve same effect -> use div
    const style: string = 'position:absolute;width:100%;height:100%;pointer-events: none;'
    return dom.addContentTo(this.referenceBox.getId(), '<svg style="'+style+'">'+top+bottom+right+left+'</svg>')
  }

}
