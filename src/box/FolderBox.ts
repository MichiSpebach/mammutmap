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
  private readonly body: FolderBoxBody
  private links: Link[] = []

  public constructor(name: string, parent: FolderBox|null, mapData: BoxMapData, mapDataFileExists: boolean) {
    super(name, parent, mapData, mapDataFileExists)
    this.body = new FolderBoxBody(this)
  }

  protected createHeader(): FolderBoxHeader {
    return new FolderBoxHeader(this)
  }

  protected getOverflow(): 'visible' {
    return 'visible'
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

  public async addLink(from: WayPoint, to: WayPoint): Promise<void> {
    const linkData = new BoxMapLinkData(util.generateId(), [from], [to])
    this.getMapLinkData().push(linkData)

    const link: Link = new Link(linkData, this)
    this.links.push(link)

    await link.render()
    await this.saveMapData()
  }

  private async renderLinks(): Promise<void> {
    this.getMapLinkData().forEach((linkData: BoxMapLinkData) => {
      this.links.push(new Link(linkData, this))
    })

    await Promise.all(this.links.map(async (link: Link) => {
      await link.render()
    }))
  }

}
