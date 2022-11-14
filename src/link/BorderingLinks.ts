import { WayPointData } from "../mapData/WayPointData"
import { util } from "../util"
import { Link } from "./Link"
import { Box } from "../box/Box"
import { NodeWidget } from "../node/NodeWidget"

export class BorderingLinks {
  private readonly referenceBoxOrNode: Box|NodeWidget
  protected readonly links: Link[]

  public constructor(referenceBoxOrNode: Box|NodeWidget, links: Link[]) {
    this.referenceBoxOrNode = referenceBoxOrNode
    this.links = links
    this.links.forEach(link => this.warnIfLinkIsManagedByReferenceBox(link))
  }

  private warnIfLinkIsManagedByReferenceBox(link: Link): void {
    if (this.referenceBoxOrNode === link.getManagingBox()) {
      let message = `Adding link with id ${link.getId()} to BorderingLinks`
      message += ` of box with name ${this.referenceBoxOrNode.getName()} that is managed by this box.`
      message += ` Only bordering/adjacent links should be added here.`
      util.logWarning(message)
    }
  }

  public async reorderAndSaveAll(): Promise<void> {
    await Promise.all(this.links.map(link => link.reorderAndSave()))
  }

  public async renderAll(): Promise<void> {
    await Promise.all(this.links.map(link => link.render()))
  }

  public async renderAllNotManagedBy(box: Box): Promise<void> {
    await Promise.all(this.links.filter(link => link.getManagingBox() !== box).map(link => link.render()))
  }

  public async setHighlightAll(highlight: boolean): Promise<void> {
    await Promise.all(this.links.map(link => link.renderWithOptions({highlight})))
  }

  public getLinksThatIncludeWayPointFor(boxOrNode: Box|NodeWidget): Link[] {
    return this.links.filter((link: Link) => {
        return link.getData().from.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxOrNode.getId())
            || link.getData().to.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxOrNode.getId())
      }
    )
  }

  public register(link: Link): void {
    if (this.includes(link)) {
      let message = `Trying to register borderingLink with id ${link.getId()}`
      message += ` to box with name ${this.referenceBoxOrNode.getName()} that is already registered at this box.`
      util.logWarning(message)
      return
    }
    this.warnIfLinkIsManagedByReferenceBox(link)
    
    this.links.push(link)
    if (!this.referenceBoxOrNode.isMapDataFileExisting()) {
      // otherwise managingBox of link would save linkPath with not persisted boxId
      this.referenceBoxOrNode.saveMapData()
    }
  }

  public deregister(link: Link): void {
    if (!this.includes(link)) {
      let message = `Trying to deregister borderingLink with id ${link.getId()}`
      message += ` from box with name ${this.referenceBoxOrNode.getName()} that is not registered at this box.`
      util.logWarning(message)
      return
    }
    this.links.splice(this.links.indexOf(link), 1)
  }

  public includes(link: Link): boolean {
    return this.links.includes(link)
  }

  public getOutgoingLinks(): Link[] {
    return this.links.filter(link => link.from.getRenderedPathWithoutManagingBox().includes(this.referenceBoxOrNode))
  }

}
