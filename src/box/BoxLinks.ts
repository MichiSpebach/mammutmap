import { util } from '../util'
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

    public getId(): string {
      return this.referenceBox.getId()+'Links'
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

      await this.addPlaceholderFor(link)
      await link.render()
      if (reorderAndSave) {
        await link.reorderAndSave()
      }

      return link
    }

    public async removeLink(link: Link): Promise<void> {
      if (!this.links.includes(link)) {
        util.logWarning('trying to remove link from box "'+this.referenceBox.getName()+'" that is not managed by that box')
        return
      }

      await link.unrender()
      await this.removePlaceholderFor(link)

      this.links.splice(this.links.indexOf(link), 1)
      this.referenceBox.getMapLinkData().splice(this.referenceBox.getMapLinkData().indexOf(link.getData()), 1)
      await this.referenceBox.saveMapData()
    }

    public async render(): Promise<void> {
      if (this.rendered) {
        return
      }

      this.referenceBox.getMapLinkData().forEach((linkData: BoxMapLinkData) => {
        this.links.push(new Link(linkData, this.referenceBox))
      })

      await Promise.all(this.links.map(async (link: Link) => {
        await this.addPlaceholderFor(link)
        await link.render()
      }))

      this.rendered = true
    }

    private async addPlaceholderFor(link: Link): Promise<void> {
      await renderManager.addContentTo(this.getId(), '<div id="'+link.getId()+'"></div>')
    }

    private async removePlaceholderFor(link: Link): Promise<void> {
      await renderManager.remove(link.getId())
    }

    public async unrender(): Promise<void> {
      if (!this.rendered) {
        return
      }

      await Promise.all(this.links.map(async (link: Link) => {
        await link.unrender()
        await this.removePlaceholderFor(link)
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
