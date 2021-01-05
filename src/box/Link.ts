import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'

export class Link {
  private readonly id: string
  private from: Box
  private fromPosition: {x: number, y: number}
  private to: Box
  private toPosition: {x: number, y: number}

  public constructor(id: string, from: Box, fromPosition: {x: number, y: number}, to: Box, toPosition: {x: number, y: number}) {
    this.id = id
    this.from = from
    this.fromPosition = fromPosition
    this.to = to
    this.toPosition = toPosition
  }

  public async render(): Promise<void> {
    let line: string = '<line x1="0%" y1="50%" x2="100%" y2="50%" style="stroke:blue;stroke-width:2px"/>'
    await dom.addContentTo('root', '<svg id="' + this.id + '">' + line + '</svg>')

    await this.renderStyle()
  }

  public async renderStyle(): Promise<void> {
    return dom.setStyleTo(this.id, 'position:absolute;width:100%;height:100%;')
  }

}
