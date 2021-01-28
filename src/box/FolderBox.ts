import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { BoxMapData } from './BoxMapData'
import { FolderBoxHeader } from './FolderBoxHeader'
import { FolderBoxBody } from './FolderBoxBody'
import { Link } from './Link'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPoint } from './WayPoint'
import { DragManager } from '../DragManager'

export class FolderBox extends Box {
  private link: Link|null
  private dragOver: boolean = false
  private readonly body: FolderBoxBody

  public constructor(name: string, parent: FolderBox|null, mapData: BoxMapData, mapDataFileExists: boolean) {
    super(name, parent, mapData, mapDataFileExists)
    this.body = new FolderBoxBody(this)

    if (name == 'box') {
      const fromWayPoint = new WayPoint('iu4msv07ut8', 100, 50)
      const toWayPoint = new WayPoint('93kjm246u28', 0, 50)
      const linkData = new BoxMapLinkData('testLink', [fromWayPoint], [toWayPoint])
      this.link = new Link(linkData, this)
      util.logInfo("box has a link")
    } else {
      this.link = null
    }
  }

  protected createHeader(): FolderBoxHeader {
    return new FolderBoxHeader(this)
  }

  protected getOverflow(): 'visible' {
    return 'visible'
  }

  protected getAdditionalStyle(): string {
    if (this.dragOver) {
      return 'background-color:#33F6'
    } else {
      return 'background-color:#0000'
    }
  }

  public setDragOverStyle(value: boolean) {
    this.dragOver = value
    this.renderStyle()
  }

  protected async renderBody(): Promise<void> {
    await this.body.render()

    DragManager.addDropTarget(this) // TODO: move to other method?

    this.renderLinks()
  }

  public getChild(id: string): Box {
    return this.body.getBox(id)
  }

  public async addBox(box: Box): Promise<void> { // TODO: rename to addChild?
    return this.body.addBox(box)
  }

  public removeBox(box: Box): void { // TODO: rename to removeChild?
    return this.body.removeBox(box)
  }

  private async renderLinks(): Promise<void> {
    if (this.link != null) {
      return this.link.render()
    }
  }

}
