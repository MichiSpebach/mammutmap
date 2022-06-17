import { WayPointData } from "../box/WayPointData";
import { util } from "../util";
import { Link } from "../box/Link";
import { Box } from "../box/Box";

export class BorderingLinks {
  private readonly referenceBox: Box
  private readonly links: Link[] = []
  
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

  public register(link: Link): void {
    if (this.links.includes(link)) {
      util.logWarning('trying to register borderingLink that is already registered')
      return
    }
    this.links.push(link)
    if (!this.referenceBox.isMapDataFileExisting()) {
      // otherwise managingBox of link would save linkPath with not persisted boxId
      this.referenceBox.saveMapData()
    }
  }
  
  public deregister(link: Link): void {
    if (!this.links.includes(link)) {
      util.logWarning('trying to deregister borderingLink that is not registered')
      return
    }
    this.links.splice(this.links.indexOf(link), 1)
  }

  public filterFor(boxId: string): Link[] {
    return this.links.filter((link: Link) => {
        return link.getData().from.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxId)
            || link.getData().to.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxId)
      }
    )
  }

}