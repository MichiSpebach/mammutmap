import * as util from '../util'
import * as dom from '../domAdapter'
import { style } from '../styleAdapter'
import { Box } from './Box'
import { BoxMapData } from './BoxMapData'
import { FolderBoxHeader } from './FolderBoxHeader'
import { FolderBoxBody } from './FolderBoxBody'
import { Link } from './Link'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPointData } from './WayPointData'

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

  public async render(): Promise<void> {
    await super.render()
    dom.addClassTo(super.getId(), style.getFolderBoxClass())
  }

  protected async renderBody(): Promise<void> {
    await this.body.render()
    this.renderLinks()
  }

  public isBodyRendered(): boolean {
    return this.body.isRendered()
  }

  public getBox(id: string): Box {
    return this.body.getBox(id)
  }

  public containsBox(box: Box): boolean {
    return this.body.containsBox(box)
  }

  public async addBox(box: Box): Promise<void> {
    return this.body.addBox(box)
  }

  public removeBox(box: Box): void {
    return this.body.removeBox(box)
  }

  public static changeManagingBoxOfLinkAndSave(oldManagingBox: FolderBox, newManagingBox: FolderBox, link: Link): void {
    if (link.getBase() !== newManagingBox) {
      util.logWarning('baseBox/managingBox '+newManagingBox.getSrcPath()+' of given link '+link.getId()+' does not match newManagingBox '+newManagingBox.getSrcPath())
    }
    if (newManagingBox.links.includes(link)) {
      util.logWarning('box '+newManagingBox.getSrcPath()+' already manages link '+link.getId())
    }
    if (!oldManagingBox.links.includes(link)) {
      util.logWarning('box '+oldManagingBox.getSrcPath()+' does not manage link '+link.getId())
    }

    newManagingBox.links.push(link)
    dom.appendChildTo(newManagingBox.getId(), link.getId())
    oldManagingBox.links.splice(oldManagingBox.links.indexOf(link), 1)

    newManagingBox.getMapLinkData().push(link.getData())
    oldManagingBox.getMapLinkData().splice(oldManagingBox.getMapLinkData().indexOf(link.getData()), 1)
    newManagingBox.saveMapData()
    oldManagingBox.saveMapData()
  }

  public async addLink(from: WayPointData, to: WayPointData): Promise<void> {
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
