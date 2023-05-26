import { WayPointData } from "../mapData/WayPointData"
import { Link } from "./Link"
import { Box } from "../box/Box"
import { NodeWidget } from "../node/NodeWidget"

export class BorderingLinks {
  private readonly referenceBoxOrNode: Box|NodeWidget

  public constructor(referenceBoxOrNode: Box|NodeWidget) {
    this.referenceBoxOrNode = referenceBoxOrNode
  }

  public getAll(): Link[] {
    if (this.referenceBoxOrNode.isRoot()) {
      return []
    }

    const allParentLinks: Link[] = [
      ...this.referenceBoxOrNode.getParent().links.getLinks(),
      ...this.referenceBoxOrNode.getParent().borderingLinks.getAll()
    ]
    const boxOrNodeId: string = this.referenceBoxOrNode.getId()
    return allParentLinks.filter(link => {
      return link.getData().from.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxOrNodeId)
          || link.getData().to.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxOrNodeId)
    })
  }

  public async renderAll(): Promise<void> {
    await Promise.all(this.getAll().map(link => link.render()))
  }

  public async renderAllThatShouldBe(): Promise<void> {
    await Promise.all(this.getLinksThatShouldBeRendered().map(link => link.render()))
  }

  public async setHighlightAllThatShouldBeRendered(highlight: boolean): Promise<void> {
    await Promise.all(this.getLinksThatShouldBeRendered().map(link => link.renderWithOptions({highlight})))
  }

  public getLinksThatShouldBeRendered(): Link[] {
    return this.getAll().filter(link => link.getManagingBox().isBodyBeingRendered())
  }

  public getOutgoing(): Link[] {
    return this.getAll().filter(link => link.from.getRenderedPathWithoutManagingBox().includes(this.referenceBoxOrNode))
  }

}
