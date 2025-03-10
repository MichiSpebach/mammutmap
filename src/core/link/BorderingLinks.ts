import { WayPointData } from "../mapData/WayPointData"
import { Link } from "./Link"
import { Box } from "../box/Box"
import { NodeWidget } from "../node/NodeWidget"
import { LinkEnd } from "./LinkEnd"
import { log } from "../logService"

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

  public getAllEnds(): LinkEnd[] {
    return this.getAll().map(link => {
      if (link.from.isBoxInPath(this.referenceBoxOrNode)) {
        return link.from
      }
      if (!link.to.isBoxInPath(this.referenceBoxOrNode)) {
        log.warning(`BorderingLinks::getAllEnds() boxOrNode ${this.referenceBoxOrNode.getName()} is neither in fromEnd nor in toEnd of link ${link.getId()}.`)
      }
      return link.to
    })
  }

  /** TODO: remove and just use renderAllThatShouldBe()? */
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
    return this.getAll().filter(link => link.shouldBeRendered())
  }

  public getOutgoing(): Link[] {
    return this.getAll().filter(link => link.from.getRenderedPathWithoutManagingBox().includes(this.referenceBoxOrNode))
  }

  public getIngoing(): Link[] {
    return this.getAll().filter(link => link.to.getRenderedPathWithoutManagingBox().includes(this.referenceBoxOrNode))
  }

}
