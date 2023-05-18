import { WayPointData } from "../mapData/WayPointData"
import { util } from "../util/util"
import { Link } from "./Link"
import { Box } from "../box/Box"
import { NodeWidget } from "../node/NodeWidget"

const useOldComplicatedMechanismThatCachesAndIsMaybeFaster: boolean = false // TODO: cleanup as soon as save

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
      let message = `Adding link with id '${link.getId()}' to BorderingLinks`
      message += ` of box with name '${this.referenceBoxOrNode.getName()}' that is managed by this box.`
      message += ` Only bordering/adjacent links should be added here.`
      util.logWarning(message)
    }
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
    if (useOldComplicatedMechanismThatCachesAndIsMaybeFaster) {
      await Promise.all(this.links.map(link => link.render()))
    }
    await Promise.all(this.getAll().map(link => link.render()))
  }

  public async renderAllThatShouldBe(): Promise<void> {
    await Promise.all(this.getLinksThatShouldBeRendered().map(link => link.render()))
  }

  public async setHighlightAllThatShouldBeRendered(highlight: boolean): Promise<void> {
    await Promise.all(this.getLinksThatShouldBeRendered().map(link => link.renderWithOptions({highlight})))
  }

  public getLinksThatShouldBeRendered(): Link[] {
    if (useOldComplicatedMechanismThatCachesAndIsMaybeFaster) {
      return this.links.filter(link => link.getManagingBox().isBodyBeingRendered())
    }
    return this.getAll().filter(link => link.getManagingBox().isBodyBeingRendered())
  }

  public getLinksThatIncludeWayPointFor(boxOrNode: Box|NodeWidget): Link[] {
    if (!useOldComplicatedMechanismThatCachesAndIsMaybeFaster) {
      return []
    }
    return this.links.filter((link: Link) => {
        return link.getData().from.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxOrNode.getId())
            || link.getData().to.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxOrNode.getId())
      }
    )
  }

  public register(link: Link): void {
    if (!useOldComplicatedMechanismThatCachesAndIsMaybeFaster) {
      return
    }
    if (this.includes(link)) {
      let message = `Trying to register borderingLink with id '${link.getId()}'`
      message += ` to box with name '${this.referenceBoxOrNode.getName()}' that is already registered at this box.`
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
    if (!useOldComplicatedMechanismThatCachesAndIsMaybeFaster) {
      return
    }
    if (!this.includes(link)) {
      let message = `Trying to deregister borderingLink with id '${link.getId()}'`
      message += ` from box with name '${this.referenceBoxOrNode.getName()}' that is not registered at this box.`
      util.logWarning(message)
      return
    }
    this.links.splice(this.links.indexOf(link), 1)
  }

  private includes(link: Link): boolean {
    return this.links.includes(link)
  }

  public getOutgoing(): Link[] {
    if (useOldComplicatedMechanismThatCachesAndIsMaybeFaster) {
      return this.links.filter(link => link.from.getRenderedPathWithoutManagingBox().includes(this.referenceBoxOrNode))
    }
    return this.getAll().filter(link => link.from.getRenderedPathWithoutManagingBox().includes(this.referenceBoxOrNode))
  }

}
