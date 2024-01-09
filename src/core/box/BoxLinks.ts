import { util } from '../util/util'
import { renderManager } from '../RenderManager'
import { Box } from './Box'
import { Link } from '../link/Link'
import { LinkData } from '../mapData/LinkData'
import { WayPointData } from '../mapData/WayPointData'
import { NodeWidget } from '../node/NodeWidget'
import { Widget } from '../Widget'
import { SkipToNewestScheduler } from '../util/SkipToNewestScheduler'
import { AbstractNodeWidget } from '../AbstractNodeWidget'
import { log } from '../logService'
import { LocalPosition } from '../shape/LocalPosition'
import { ClientPosition } from '../shape/ClientPosition'
import { NodeData } from '../mapData/NodeData'

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

    public async addWithClickToDropMode(options?: {
      fromNode?: Box|NodeWidget,
      fromPosition?: LocalPosition|ClientPosition,
      toPositionAtStart?: LocalPosition|ClientPosition,
    }): Promise<void> {
      const fromNode: Box|NodeWidget = options?.fromNode ?? this.referenceBox
      let fromPosition: LocalPosition|ClientPosition = options?.fromPosition ?? new LocalPosition(50, 50)
      let toPositionAtStart: LocalPosition|ClientPosition = options?.toPositionAtStart ?? renderManager.getCursorClientPosition()

      if (fromPosition instanceof ClientPosition) {
        fromPosition = await this.referenceBox.transform.clientToLocalPosition(fromPosition)
      }
      if (toPositionAtStart instanceof ClientPosition) {
        toPositionAtStart = await this.referenceBox.transform.clientToLocalPosition(toPositionAtStart)
      }

      const from = {node: fromNode, positionInFromNodeCoords: fromPosition}
      const to = {node: this.referenceBox, positionInToNodeCoords: toPositionAtStart}
      const link: Link = await this.add({from, to, save: false})

      await link.to.startDragWithClickToDropMode()
    }

    public async add(options: {
      from: Box|NodeWidget | {node: Box|NodeWidget, positionInFromNodeCoords?: LocalPosition}
      to: Box|NodeWidget | {node: Box|NodeWidget, positionInToNodeCoords?: LocalPosition}
      save: boolean
    }): Promise<Link> {
      const fromNode: Box|NodeWidget = options.from instanceof Box || options.from instanceof NodeWidget
        ? options.from
        : options.from.node
      const toNode: Box|NodeWidget = options.to instanceof Box || options.to instanceof NodeWidget
        ? options.to
        : options.to.node

      if (this.referenceBox !== fromNode && !this.referenceBox.isAncestorOf(fromNode)) {
        log.warning(`BoxLinks::add(from: ${fromNode.getName()}, to: ${toNode.getName()}) from is not an descendant of referred box (${this.referenceBox.getName()}).`)
      }
      if (this.referenceBox !== toNode && !this.referenceBox.isAncestorOf(toNode)) {
        log.warning(`BoxLinks::add(from: ${fromNode.getName()}, to: ${toNode.getName()}) to is not an descendant of referred box (${this.referenceBox.getName()}).`)
      }

      const link: Link = await Link.newOfEnds({from: options.from, to: options.to, managingBox: this.referenceBox})
      await this.addNewLink(link, options)
      return link
    }

    public async addCopy(link: Link): Promise<Link> { // TODO: move into Link?
      if(link.getManagingBox() !== this.referenceBox) {
        log.warning(`BoxLinks::addCopy(link: ${link.describe()}) link.getManagingBox() should be same as this.referenceBox.`)
      }

      const linkDataCopy: any = JSON.parse(JSON.stringify(link.getData()))
      linkDataCopy.id = 'link'+util.generateId()
      const newLink: Link = Link.new(LinkData.buildFromRawObject(linkDataCopy), this.referenceBox)
      await this.addNewLink(newLink, {save: true})
      return newLink
    }

    private async addNewLink(link: Link, options: {save: boolean}): Promise<void> {
      this.referenceBox.getMapLinkData().push(link.getData()) // TODO: move into Link?
      this.links.push(link)

      const ongoing: Promise<void>[] = []
      if (options.save) {
        ongoing.push(this.referenceBox.saveMapData())
      }
      if (this.rendered) {
        await this.addPlaceholderFor(link)
      }
      if (this.rendered) { // recheck because of possible racecondition with (un)render(), TODO use this.renderScheduler somehow to solve racecondition
        ongoing.push(link.render())
      }
      await Promise.all(ongoing)
    }

    /** TODO: move into Link? */
    /** TODO: offer insertNodeIntoLink(..) in LocalPositions because ClientPositions may not work well when zoomed far away */
    public async insertNodeIntoLink(link: Link, waypoint: Box, position: ClientPosition): Promise<{insertedNode: NodeWidget, addedLink: Link}> {
      const positionInWaypoint: LocalPosition = await waypoint.transform.clientToLocalPosition(position)
      const insertedNode: NodeWidget = await waypoint.nodes.add(new NodeData('node'+util.generateId(), positionInWaypoint.percentX, positionInWaypoint.percentY))
      const insertedNodePosition: ClientPosition = (await insertedNode.getClientShape()).getMidPosition()
    	const addedLink: Link = await link.getManagingBoxLinks().addCopy(link)

      if (link.from.isBoxInPath(waypoint)) { // ensures that managingBox of link gets heavier part and is not changed
        await Promise.all([
          link.from.dragAndDrop({dropTarget: insertedNode, clientPosition: insertedNodePosition}),
          addedLink.to.dragAndDrop({dropTarget: insertedNode, clientPosition: insertedNodePosition})
        ])
        return {insertedNode, addedLink}
      }
      if (link.to.isBoxInPath(waypoint)) { // ensures that managingBox of link gets heavier part and is not changed
        await Promise.all([
          link.to.dragAndDrop({dropTarget: insertedNode, clientPosition: insertedNodePosition}),
          addedLink.from.dragAndDrop({dropTarget: insertedNode, clientPosition: insertedNodePosition})
        ])
        return {insertedNode, addedLink}
      }
      log.warning(`BoxLinks::insertNodeIntoLink(link, waypoint, ..) waypoint is not in link.`)
      return {insertedNode, addedLink}
    }

    public async removeLink(link: Link): Promise<void> {
      if (!this.links.includes(link)) {
        util.logWarning('trying to remove link from box "'+this.referenceBox.getName()+'" that is not managed by that box')
        return
      }

      this.links.splice(this.links.indexOf(link), 1) // before unrender() and removePlaceholderFor(link) to prevent rerender TODO: introduce 'mounted: boolean' or 'destructed: boolean' in Link instead?
      this.referenceBox.getMapLinkData().splice(this.referenceBox.getMapLinkData().indexOf(link.getData()), 1)

      const pros: Promise<void>[] = link.getTags().map(tag => link.removeTag(tag))
      await link.unrender() // checks by itself if it is rendered
      if (this.rendered) {
        pros.push(this.removePlaceholderFor(link)) // TODO possible racecondition with (un)render(), use this.renderScheduler somehow to solve racecondition
      }
      pros.push(this.referenceBox.saveMapData())
      await Promise.all(pros)
    }

    public async render(): Promise<void> { await this.renderScheduler.schedule(async () => {
      if (this.rendered) {
        // links that are connected to NodeWidgets need to be rerendered
        // because size of NodeWidgets is not percental // TODO: use smart css attributes to handle this
        this.links.filter(link => { // TODO there is no await
          return link.from.getDeepestRenderedWayPoint().linkable instanceof NodeWidget
            || link.to.getDeepestRenderedWayPoint().linkable instanceof NodeWidget
        }).forEach(link => link.render())
        return
      }
      this.rendered = true

      const placeholderPros: Promise<void>[] = []
      const partialRendered: boolean = this.links.length > 0

      for (const linkData of this.referenceBox.getMapLinkData()) {
        let link: Link|undefined
        if (partialRendered) {
          link = this.links.find(link => link.getId() === linkData.id)
        }
        if (!link) {
          link = Link.new(linkData, this.referenceBox)
          this.links.push(link)
        }
        placeholderPros.push(this.addPlaceholderFor(link))
      }

      await Promise.all(placeholderPros)
      await Promise.all(this.links.map((link: Link) => link.render()))
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
      this.rendered = false

      await Promise.all(this.links.map(async (link: Link) => {
        await link.unrender()
        await this.removePlaceholderFor(link)
      }))
      this.links = []
    })}

    /** @deprecated use findLinkRoute(..) instead */
    public getLinkWithEndBoxes(from: Box, to: Box): Link|undefined {
      return this.links.find((link: Link) => {
        const linkFromWayPoints: WayPointData[] = link.getData().from.path
        const linkToWayPoints: WayPointData[] = link.getData().to.path
        const linkFromBoxId: string = linkFromWayPoints[linkFromWayPoints.length-1].boxId
        const linkToBoxId: string = linkToWayPoints[linkToWayPoints.length-1].boxId
        return linkFromBoxId === from.getId() && linkToBoxId === to.getId()
      })
    }

    /** TODO: use implementation of linkBundler.findAndExtendCommonRoutes(..), is directed and more efficient */
    public static findLinkRoute(from: AbstractNodeWidget, to: AbstractNodeWidget, options: {maxHops: number} = {maxHops: 4}): Link[]|undefined {
      const directed: boolean = false
      if (options.maxHops < 0) {
        return undefined
      }

      let links = from.borderingLinks.getOutgoing()
      if (from instanceof Box) {
        links = from.links.getManagedStartingLinks().concat(links) // has only be done in first iteration
      }
      for (const link of links) {
        const node: AbstractNodeWidget = link.to.getDeepestRenderedWayPoint().linkable // TODO? implement solution that always works and reactivate warning below
        if (node.getId() === to.getId()) {
          return [link]
        }
        const linkToPath: WayPointData[] = link.getData().to.path
        const linkTargetId: string = linkToPath[linkToPath.length-1].boxId
        if (linkTargetId !== node.getId()) {
          // deactivated warning for now because it happens too often, TODO reactivate as soon as better solution is implemented
          //log.warning(`BoxLinks::getLinkRouteWithEndBoxes(..) linkTargetId(${linkTargetId}) does not match deepestRenderedNodeId(${node.getId()}).`)
        }
        if (!(node instanceof NodeWidget)) {
          // TODO this also ignores inner LinkNodes that are not rendered, improve
          continue
        }
        const route: Link[]|undefined = this.findLinkRoute(node, to, {maxHops: options.maxHops-1})
        if (route) {
          return [link, ...route]
        }
      }
      return undefined
    }

    private getManagedStartingLinks(): Link[] {
      return this.getLinks().filter(link => {
        const fromPath: WayPointData[] = link.getData().from.path
        const fromEnd: WayPointData|undefined = fromPath.at(0)
        if (!fromEnd) {
          log.warning(`BoxLinks::getLinkRouteWithEndBoxes(..) fromEnd of link "${link.describe()}" is undefined.`)
          return false
        }

        if (!(fromEnd.boxId === this.referenceBox.getId())) {
          return false
        }
        if (fromPath.length !== 1) {
          log.warning(`BoxLinks::getLinkRouteWithEndBoxes(..) fromPath of link "${link.describe()}" is not required to start with managingBox.`)
          return false
        }
        return true
      })
    }

    public getLinks(): Link[] {
      return this.links
    }

}
