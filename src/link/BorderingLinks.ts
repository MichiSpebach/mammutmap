import { WayPointData } from "../mapData/WayPointData"
import { util } from "../util"
import { Link } from "./Link"
import { Box } from "../box/Box"
import { NodeWidget } from "../node/NodeWidget"

export class BorderingLinks {
  private readonly referenceBoxOrNode: Box|NodeWidget
  protected readonly links: Link[] = []

  public constructor(referenceBoxOrNode: Box|NodeWidget) {
    this.referenceBoxOrNode = referenceBoxOrNode
  }

  public async reorderAndSaveAll(): Promise<void> {
    await Promise.all(this.links.map(link => link.reorderAndSave()))
  }

  public async renderAll(): Promise<void> {
    await Promise.all(this.links.map(link => link.render()))
  }

  public async setHighlightAll(highlight: boolean): Promise<void> {
    await Promise.all(this.links.map(link => link.renderWithOptions({highlight})))
  }

  public async renderLinksThatIncludeWayPointFor(boxOrNodeId: string): Promise<void> {
    const linksToUpdate: Link[] = this.filterFor(boxOrNodeId)
    await Promise.all(linksToUpdate.map(async (link: Link) => {
      await link.render()
    }))
  }

  private filterFor(boxId: string): Link[] {
    return this.links.filter((link: Link) => {
        return link.getData().from.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxId)
            || link.getData().to.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxId)
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
