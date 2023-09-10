import { util } from '../util/util'
import { renderManager } from '../RenderManager'
import { Box } from './Box'
import { Link } from '../link/Link'
import { LinkData } from '../mapData/LinkData'
import { WayPointData } from '../mapData/WayPointData'
import { LinkEndData } from '../mapData/LinkEndData'
import { NodeWidget } from '../node/NodeWidget'
import { Widget } from '../Widget'
import { SkipToNewestScheduler } from '../util/SkipToNewestScheduler'
import { AbstractNodeWidget } from '../AbstractNodeWidget'
import { log } from '../logService'

export class BoxLinks extends Widget {
    private readonly referenceBox: Box
    private links: Link[] = []
    private rendered: boolean = false
    private renderScheduler: SkipToNewestScheduler = new SkipToNewestScheduler()

    public constructor(referenceBox: Box) {
      super()
      this.referenceBox = referenceBox
    }

    public getId(): string {
      return this.referenceBox.getId()+'Links'
    }

    public static async changeManagingBoxOfLinkAndSave(oldManagingBox: Box, newManagingBox: Box, link: Link): Promise<void> {
      if (link.getManagingBox() !== newManagingBox) {
        util.logWarning('managingBox '+link.getManagingBox().getSrcPath()+' of given link '+link.getId()+' does not match newManagingBox '+newManagingBox.getSrcPath())
      }
      if (newManagingBox.links.links.includes(link)) {
        util.logWarning('box '+newManagingBox.getSrcPath()+' already manages link '+link.getId())
      }
      if (!oldManagingBox.links.links.includes(link)) {
        util.logWarning('box '+oldManagingBox.getSrcPath()+' does not manage link '+link.getId())
      }
      const proms: Promise<any>[] = []

      newManagingBox.links.links.push(link)
      proms.push(renderManager.appendChildTo(newManagingBox.links.getId(), link.getId()))
      oldManagingBox.links.links.splice(oldManagingBox.links.links.indexOf(link), 1)

      newManagingBox.getMapLinkData().push(link.getData())
      oldManagingBox.getMapLinkData().splice(oldManagingBox.getMapLinkData().indexOf(link.getData()), 1)
      proms.push(newManagingBox.saveMapData())
      proms.push(oldManagingBox.saveMapData())

      await Promise.all(proms)
    }

    public async add(from: Box|NodeWidget, to: Box|NodeWidget): Promise<Link> {
      if (!this.referenceBox.isAncestorOf(from)) {
        log.warning(`BoxLinks::add(from: ${from.getName()}, to: ${to.getName()}) from is not an descendant of referred box (${this.referenceBox.getName()}).`)
      }
      if (!this.referenceBox.isAncestorOf(to)) {
        log.warning(`BoxLinks::add(from: ${from.getName()}, to: ${to.getName()}) to is not an descendant of referred box (${this.referenceBox.getName()}).`)
      }

      const fromWayPoint = WayPointData.buildNew(from.getId(), from.getName(), 50, 50)
      const toWayPoint = WayPointData.buildNew(to.getId(), to.getName(), 50, 50)

      const fromLinkEnd = {mapData: new LinkEndData([fromWayPoint]), linkable: from}
      const toLinkEnd = {mapData: new LinkEndData([toWayPoint]), linkable: to}

      return this.addLink(fromLinkEnd, toLinkEnd, true)
    }

    // TODO: rename to addWithData
    public async addLink(
      from: {mapData: LinkEndData, linkable: Box|NodeWidget}, 
      to: {mapData: LinkEndData, linkable: Box|NodeWidget}, 
      reorderAndSave: boolean
    ): Promise<Link> {
      const linkData = new LinkData(util.generateId(), from.mapData, to.mapData)
      this.referenceBox.getMapLinkData().push(linkData)

      const link: Link = Link.new(linkData, this.referenceBox)
      this.links.push(link)

      await this.addPlaceholderFor(link)

      if (reorderAndSave) {
        await link.reorderAndSaveAndRender({movedWayPoint: from.linkable}) // TODO: decide and handle reorder in Link.new(..) and remove reorderAndSave option
        await link.reorderAndSaveAndRender({movedWayPoint: to.linkable}) // TODO: decide and handle reorder in Link.new(..) and remove reorderAndSave option
      } else {
        await link.render()
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

    public async render(): Promise<void> { await this.renderScheduler.schedule(async () => {
      if (this.rendered) {
        // links that are connected to NodeWidgets need to be rerendered
        // because size of NodeWidgets is not percental // TODO: use smart css attributes to handle this
        this.links.filter(link => {
          return link.from.getDeepestRenderedWayPoint().linkable instanceof NodeWidget
            || link.to.getDeepestRenderedWayPoint().linkable instanceof NodeWidget
        }).forEach(link => link.render())
        return
      }

      const placeholderPros: Promise<void>[] = []

      for (const linkData of this.referenceBox.getMapLinkData()) {
        if (this.links.find(link => link.getId() === linkData.id)) {
          continue
        }
        const link: Link = Link.new(linkData, this.referenceBox)
        this.links.push(link)
        placeholderPros.push(this.addPlaceholderFor(link))
      }

      await Promise.all(placeholderPros)
      await Promise.all(this.links.map((link: Link) => link.render()))
      this.rendered = true
    })}

    private async addPlaceholderFor(link: Link): Promise<void> {
      await renderManager.addContentTo(this.getId(), '<div id="'+link.getId()+'"></div>')
    }

    private async removePlaceholderFor(link: Link): Promise<void> {
      await renderManager.remove(link.getId())
    }

    public async unrender(): Promise<void> { await this.renderScheduler.schedule(async () => {
      if (!this.rendered) {
        return
      }

      await Promise.all(this.links.map(async (link: Link) => {
        await link.unrender()
        await this.removePlaceholderFor(link)
      }))
      this.links = []
      this.rendered = false
    })}

    public getLinkWithEndBoxes(from: Box, to: Box): Link|undefined {
      return this.links.find((link: Link) => {
        const linkFromWayPoints: WayPointData[] = link.getData().from.path
        const linkToWayPoints: WayPointData[] = link.getData().to.path
        const linkFromBoxId: string = linkFromWayPoints[linkFromWayPoints.length-1].boxId
        const linkToBoxId: string = linkToWayPoints[linkToWayPoints.length-1].boxId
        return linkFromBoxId === from.getId() && linkToBoxId === to.getId()
      })
    }

    public static getLinkRouteWithEndBoxes(from: AbstractNodeWidget, to: AbstractNodeWidget, options: {maxNodes: number} = {maxNodes: 2,}): Link[]|undefined {
      const directed: boolean = false
      if (options.maxNodes < 0) {
        return undefined
      }
      for (const link of from.borderingLinks.getOutgoing()) {
        const node: AbstractNodeWidget = link.to.getDeepestRenderedWayPoint().linkable
        if (node.getId() === to.getId()) {
          return [link]
        }
        const linkToPath: WayPointData[] = link.getData().to.path
        const linkTargetId: string = linkToPath[linkToPath.length-1].boxId
        if (linkTargetId !== node.getId()) {
          log.warning(`BoxLinks::getLinkRouteWithEndBoxes(..) linkTargetId(${linkTargetId}) does not match deepestRenderedNodeId(${node.getId()}).`)
        }
        const route: Link[]|undefined = this.getLinkRouteWithEndBoxes(node, to, {maxNodes: options.maxNodes--})
        if (route) {
          return [link, ...route]
        }
      }
      return undefined
    }

    public getLinks(): Link[] {
      return this.links
    }

}
