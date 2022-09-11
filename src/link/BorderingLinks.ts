import { WayPointData } from "../box/WayPointData";
import { util } from "../util";
import { Link } from "../box/Link";
import { Box } from "../box/Box";

export class BorderingLinks {
  private readonly referenceBox: Box
  protected readonly links: Link[] = []

  public constructor(referenceBox: Box) {
    this.referenceBox = referenceBox
  }

  public async reorderAndSaveAll(): Promise<void> {
    await Promise.all(this.links.map(link => link.reorderAndSave()))
  }

  public async renderAll(): Promise<void> {
    await Promise.all(this.links.map(link => link.render()))
  }

  public async setHighlightAll(highlight: boolean): Promise<void> {
    await Promise.all(this.links.map(link => link.setHighlight(highlight)))
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
      message += ` to box with name ${this.referenceBox.getName()} that is already registered at this box.`
      util.logWarning(message)
      return
    }
    this.links.push(link)
    if (!this.referenceBox.isMapDataFileExisting()) {
      // otherwise managingBox of link would save linkPath with not persisted boxId
      this.referenceBox.saveMapData()
    }
  }

  public deregister(link: Link): void {
    if (!this.includes(link)) {
      let message = `Trying to deregister borderingLink with id ${link.getId()}`
      message += ` from box with name ${this.referenceBox.getName()} that is not registered at this box.`
      util.logWarning(message)
      return
    }
    this.links.splice(this.links.indexOf(link), 1)
  }

  public includes(link: Link): boolean {
    return this.links.includes(link)
  }

  public getOutgoingLinks(): Link[] {
    return this.links.filter(link => link.from.getRenderedPathWithoutManagingBox().includes(this.referenceBox))
  }

}
