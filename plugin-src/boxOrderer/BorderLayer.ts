import { Box } from '../../dist/core/box/Box'
import { Link } from '../../dist/core/link/Link'
import { LinkEnd } from '../../dist/core/link/LinkEnd'
import { LocalRect } from '../../dist/core/LocalRect'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import { Layer } from './Layer'
import { LayerSide } from './LayerSide'
import { NodeToOrder } from './NodeToOrder'

export class BorderLayer extends Layer {
	public readonly box: Box
	public topBorderingLinks: {link: Link, intersection: LocalPosition}[] = []
	public rightBorderingLinks: {link: Link, intersection: LocalPosition}[] = []
	public bottomBorderingLinks: {link: Link, intersection: LocalPosition}[] = []
	public leftBorderingLinks: {link: Link, intersection: LocalPosition}[] = []
	private sides: {side: LayerSide, borderingLinks: {link: Link, intersection: LocalPosition}[]}[] = [
		{side: this.left, borderingLinks: this.leftBorderingLinks},
		{side: this.right, borderingLinks: this.rightBorderingLinks},
		{side: this.top, borderingLinks: this.topBorderingLinks},
		{side: this.bottom, borderingLinks: this.bottomBorderingLinks}
	]

	public static async new(box: Box): Promise<BorderLayer> {
		const layer = new BorderLayer(box)
		await layer.assignBorderingLinksToSides()
		return layer
	}

	private constructor(box: Box) {
		super(
			new LayerSide('top', 0, 8),
			new LayerSide('right', 0, 8),
			new LayerSide('bottom', 0, 8),
			new LayerSide('left', 0, 8)
		)
		this.box = box
	}

	private async assignBorderingLinksToSides(): Promise<void> {
		this.topBorderingLinks = []
		this.rightBorderingLinks = []
		this.bottomBorderingLinks = []
		this.leftBorderingLinks = []
		this.sides = [
			{side: this.left, borderingLinks: this.leftBorderingLinks},
			{side: this.right, borderingLinks: this.rightBorderingLinks},
			{side: this.top, borderingLinks: this.topBorderingLinks},
			{side: this.bottom, borderingLinks: this.bottomBorderingLinks}
		]
		
		for (const link of this.box.borderingLinks.getAll()) {
			const line: {from: LocalPosition, to: LocalPosition} = await link.getLineInManagingBoxCoords()
			const lineInLocalCoords = {
				from: this.box.transform.outerCoordsRecursiveToLocal(link.getManagingBox(), line.from),
				to: this.box.transform.outerCoordsRecursiveToLocal(link.getManagingBox(), line.to)
			}
			const intersections: LocalPosition[] = new LocalRect(0, 0, 100, 100).calculateIntersectionsWithLine(lineInLocalCoords, {inclusiveEpsilon: 0.001})
			if (intersections.length < 1) {
				console.warn(`BorderLayer::assignBorderingLinksToSides() intersections.length < 1`)
				continue
			}
			if (intersections.length > 1) {
				console.warn(`BorderLayer::assignBorderingLinksToSides() intersections.length > 1`)
			}
			const intersection: LocalPosition = intersections[0]
			if (intersection.percentX < 0.1) {
				this.leftBorderingLinks.push({link, intersection})
				continue
			}
			if (intersection.percentX > 99.9) {
				this.rightBorderingLinks.push({link, intersection})
				continue
			}
			if (intersection.percentY < 0.1) {
				this.topBorderingLinks.push({link, intersection})
				continue
			}
			if (intersection.percentY > 99.9) {
				this.bottomBorderingLinks.push({link, intersection})
				continue
			}
			console.warn(`BorderLayer::assignBorderingLinksToSides() failed to assign intersection ${JSON.stringify(intersection)} to side`)
		}
	}

	public async addNodeIfFitting(node: Box|NodeWidget): Promise<{added: boolean}> {
		if (!(node instanceof NodeWidget)) {
			return {added: false}
		}
		let best: {positions: LocalPosition[], side: {side: LayerSide, borderingLinks: {link: Link, intersection: LocalPosition}[]}} | undefined
		for (const side of this.sides) {
			const intersections: LocalPosition[] = await this.getTargetPositionsOfNodeLinksToBorderingLinks(node, side.borderingLinks.map(linkWithIntersection => linkWithIntersection.link))
			if (intersections.length > (best?.positions.length?? 0)) {
				best = {positions: intersections, side}
			}
		}
		if (best) {
			const nodeToOrder: NodeToOrder = {node: node, wishPosition: this.calculateAvaragePosition(best.positions)}
			best.side.side.nodes.push(nodeToOrder)
			this.nodes.push(nodeToOrder)
		}
		return {added: !!best}
	}

	public override async getTargetPositionsOfNodeLinks(node: Box|NodeWidget): Promise<LocalPosition[]> {
		return [
			...await super.getTargetPositionsOfNodeLinks(node),
			...await this.getTargetPositionsOfNodeLinksToBorderingLinks(node, this.box.borderingLinks.getAll())
		]
	}

	private async getTargetPositionsOfNodeLinksToBorderingLinks(node: Box|NodeWidget, borderingLinks: Link[]): Promise<LocalPosition[]> {
		const positions: LocalPosition[] = []

		for (const link of borderingLinks) {
			let otherLinkEnd: LinkEnd
			if (link.from.isBoxInPath(node)) {
				otherLinkEnd = link.to
			} else if (link.to.isBoxInPath(node)) {
				otherLinkEnd = link.from
			} else {
				continue
			}
			if (otherLinkEnd.getManagingBox() === this.box) {
				positions.push(await otherLinkEnd.getTargetPositionInManagingBoxCoords())
			} else {
				positions.push(this.box.transform.outerCoordsRecursiveToLocal(otherLinkEnd.getManagingBox(), await otherLinkEnd.getTargetPositionInManagingBoxCoords()))
			}
		}

		return positions
	}
}