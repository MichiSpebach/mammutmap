import { LocalRect } from '../LocalRect'
import { JsonObject } from '../JsonObject'
import { util } from '../util'
import { LinkData } from './LinkData'
import { LocalPosition } from '../box/Transform'
import { NodeData } from './NodeData'

export class BoxData extends JsonObject {
  public readonly id: string
  public x: number
  public y: number
  public width: number
  public height: number
  public readonly links: LinkData[]
  public readonly nodes: NodeData[]

  public static buildNewFromRect(rect: LocalRect): BoxData {
    return this.buildNew(rect.x, rect.y, rect.width, rect.height)
  }

  public static buildNew(x: number, y: number, width: number, height: number): BoxData {
    return this.buildNewWithId(util.generateId(), x, y, width, height)
  }

  public static buildNewWithId(id: string, x: number, y: number, width: number, height: number): BoxData {
    return new BoxData(id, x, y, width, height, [], [])
  }

  public static buildFromJson(json: string ): BoxData /*| SyntaxError*/ {
    const parsedData: BoxData = JSON.parse(json) // parsed object has no functions

    let id: string = parsedData.id // TODO: delete this later
    if (id == null) {
      id = util.generateId()
    }

    let links: LinkData[]
    let rawLinks: LinkData[]|undefined = parsedData.links
    if (!rawLinks) {
      links = []
    } else {
      links = rawLinks.map(LinkData.buildFromRawObject) // raw object would have no methods
    }

    let nodes: NodeData[]
    let rawNodes: NodeData[]|undefined = parsedData.nodes
    if (!rawNodes) {
      nodes = []
    } else {
      nodes = rawNodes.map(NodeData.buildFromRawObject) // raw object would have no methods
    }

    return new BoxData(id, parsedData.x, parsedData.y, parsedData.width, parsedData.height, links, nodes)
  }

  public constructor(id: string, x: number, y: number, width: number, height: number, links: LinkData[], nodes: NodeData[]) {
    super()
    this.id = id
    this.x = x
    this.y = y
    this.width = width
    this.height = height
    this.links = links
    this.nodes = nodes

    this.validate()
  }

  public validate(): void {
    this.warnIf(this.id == null, 'id is null')
    this.warnIf(this.id == undefined, 'id is undefined')
    this.warnIf(this.id == '', 'id is empty')

    this.warnIf(this.x == null, 'x is null')
    this.warnIf(this.y == null, 'y is null')
    this.warnIf(this.width == null, 'width is null')
    this.warnIf(this.height == null, 'height is null')

    this.warnIf(this.x == undefined, 'x is undefined')
    this.warnIf(this.y == undefined, 'y is undefined')
    this.warnIf(this.width == undefined, 'width is undefined')
    this.warnIf(this.height == undefined, 'height is undefined')

    this.warnIf(this.width <= 0, 'width is not positive')
    this.warnIf(this.height <= 0, 'height is not positive')
  }

  private warnIf(condition: boolean, message: string) {
    if (condition) {
      this.warn(message)
    }
  }

  private warn(message: string): void {
    util.logWarning('BoxData with id '+this.id+': ' + message)
  }

  public toJson(): string {
    return util.toFormattedJson(this)
  }

  public getTopLeftPosition(): LocalPosition {
    return new LocalPosition(this.x, this.y)
  }

  public getBottomRightPosition(): LocalPosition {
    return new LocalPosition(this.x+this.width, this.y+this.height)
  }

  public getRect(): LocalRect {
    return new LocalRect(this.x, this.y, this.width, this.height)
  }

}
