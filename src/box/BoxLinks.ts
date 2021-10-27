import * as util from '../util'
import { renderManager } from '../RenderManager'
import { Box } from './Box'
import { Link } from './Link'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPointData } from './WayPointData'

export class BoxLinks {
    private readonly referenceBox: Box
    private links: Link[] = []
    private rendered: boolean = false

    public constructor(referenceBox: Box) {
      this.referenceBox = referenceBox
    }

    public static changeManagingBoxOfLinkAndSave(oldManagingBox: Box, newManagingBox: Box, link: Link): void {
      if (link.getManagingBox() !== newManagingBox) {
        util.logWarning('baseBox/managingBox '+newManagingBox.getSrcPath()+' of given link '+link.getId()+' does not match newManagingBox '+newManagingBox.getSrcPath())
      }
      if (newManagingBox.links.links.includes(link)) {
        util.logWarning('box '+newManagingBox.getSrcPath()+' already manages link '+link.getId())
      }
      if (!oldManagingBox.links.links.includes(link)) {
        util.logWarning('box '+oldManagingBox.getSrcPath()+' does not manage link '+link.getId())
      }

      newManagingBox.links.links.push(link)
      renderManager.appendChildTo(newManagingBox.getId(), link.getId())
      oldManagingBox.links.links.splice(oldManagingBox.links.links.indexOf(link), 1)

      newManagingBox.getMapLinkData().push(link.getData())
      oldManagingBox.getMapLinkData().splice(oldManagingBox.getMapLinkData().indexOf(link.getData()), 1)
      newManagingBox.saveMapData()
      oldManagingBox.saveMapData()
    }

    public async addLink(from: WayPointData, to: WayPointData, reorderAndSave: boolean): Promise<Link> {
      const linkData = new BoxMapLinkData(util.generateId(), [from], [to])
      this.referenceBox.getMapLinkData().push(linkData)

      const link: Link = new Link(linkData, this.referenceBox)
      this.links.push(link)

      await link.render()
      if (reorderAndSave) {
        await link.reorderAndSave()
      }

      return link
    }

    public async render(): Promise<void> { // TODO: render all links in one html-element like header is rendered in <boxId>header
      if (this.rendered) {
        return
      }

      this.referenceBox.getMapLinkData().forEach((linkData: BoxMapLinkData) => {
        this.links.push(new Link(linkData, this.referenceBox))
      })

      await Promise.all(this.links.map(async (link: Link) => {
        await link.render()
      }))

      this.rendered = true
    }

    public async unrender(): Promise<void> {
      if (!this.rendered) {
        return
      }

      await Promise.all(this.links.map(async (link: Link) => {
        await link.unrender()
      }))
      this.links = []

      this.rendered = false
    }

    public hasLinkWithEndBoxes(from: Box, to: Box): boolean {
      const link: Link|undefined = this.links.find((link: Link) => {
        const linkFromWayPoints: WayPointData[] = link.getData().fromWayPoints
        const linkToWayPoints: WayPointData[] = link.getData().toWayPoints
        const linkFromBoxId: string = linkFromWayPoints[linkFromWayPoints.length-1].boxId
        const linkToBoxId: string = linkToWayPoints[linkToWayPoints.length-1].boxId
        return linkFromBoxId === from.getId() && linkToBoxId === to.getId()
      })
      return link !== undefined
    }

}
