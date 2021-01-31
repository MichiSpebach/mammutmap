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
  private dragOver: boolean = false
  private readonly body: FolderBoxBody
  private links: Link[]

  public constructor(name: string, parent: FolderBox|null, mapData: BoxMapData, mapDataFileExists: boolean) {
    super(name, parent, mapData, mapDataFileExists)
    this.body = new FolderBoxBody(this)

    if (name == 'box' && !this.getMapLinkData().find(linkData => linkData.toWayPoints[0].boxId === '93kjm246u28')) { // TODO: remove
      const fromWayPoint = new WayPoint('iu4msv07ut8', 100, 50)
      const toWayPoint = new WayPoint('93kjm246u28', 0, 50)
      const linkData = new BoxMapLinkData(util.generateId(), [fromWayPoint], [toWayPoint])
      this.getMapLinkData().push(linkData)
      this.saveMapData()
      util.logInfo('add link to box and save')
    }
    if (name == 'box' && !this.getMapLinkData().find(linkData => linkData.toWayPoints[0].boxId === '3n81ck4i5sg')) { // TODO: remove
      const fromWayPoint = new WayPoint('iu4msv07ut8', 50, 100)
      const toWayPoint = new WayPoint('3n81ck4i5sg', 50, 0)
      const linkData = new BoxMapLinkData(util.generateId(), [fromWayPoint], [toWayPoint])
      this.getMapLinkData().push(linkData)
      util.logInfo('add link to box and save')
    }
    if (name == 'box' && !this.getMapLinkData().find(linkData => linkData.toWayPoints[0].boxId === 'ujltrbp3r9')) { // TODO: remove
      const fromWayPoint = new WayPoint('iu4msv07ut8', 100, 50)
      const toWayPoint = new WayPoint('ujltrbp3r9', 0, 50)
      const linkData = new BoxMapLinkData(util.generateId(), [fromWayPoint], [toWayPoint])
      this.getMapLinkData().push(linkData)
      util.logInfo('add link to box and save')
    }
    if (name == 'box' && !this.getMapLinkData().find(linkData => linkData.toWayPoints[0].boxId === 'flo206thmv')) { // TODO: remove
      const fromWayPoint = new WayPoint('93kjm246u28', 100, 25)
      const toWayPoint = new WayPoint('flo206thmv', 0, 50)
      const linkData = new BoxMapLinkData(util.generateId(), [fromWayPoint], [toWayPoint])
      this.getMapLinkData().push(linkData)
      util.logInfo('add link to box and save')
    }
    if (name == 'box' && !this.getMapLinkData().find(linkData => linkData.toWayPoints[0].boxId === 'qm6p7cuvvl')) { // TODO: remove
      const fromWayPoint = new WayPoint('flo206thmv', 50, 100)
      const toWayPoint = new WayPoint('qm6p7cuvvl', 50, 0)
      const linkData = new BoxMapLinkData(util.generateId(), [fromWayPoint], [toWayPoint])
      this.getMapLinkData().push(linkData)
      this.saveMapData()
      util.logInfo('add link to box and save')
    }

    this.links = []
    this.getMapLinkData().forEach((linkData: BoxMapLinkData) => {
      this.links.push(new Link(linkData, this))
    })

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
    await Promise.all(this.links.map(async (link: Link) => {
      await link.render()
    }))
  }

}
