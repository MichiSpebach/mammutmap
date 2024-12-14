import { Box } from '../../dist/core/box/Box'
import { Link } from '../../dist/core/link/Link'
import { LinkEnd } from '../../dist/core/link/LinkEnd'
import { LocalRect } from '../../dist/core/LocalRect'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import { Layer } from './Layer'
import { LayerSide } from './LayerSide'

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
			let intersection: LocalPosition = intersections[0]
			if (intersections.length > 1) {
				const outsideEnd: LocalPosition = new LocalRect(0, 0, 100, 100).isPositionInside(lineInLocalCoords.to, 0.001)
					? lineInLocalCoords.from
					: lineInLocalCoords.to
				if (outsideEnd.calculateDistanceTo(intersections[1]) < outsideEnd.calculateDistanceTo(intersection)) {
					intersection = intersections[1]
				}
				if (intersections.length > 2) {
					console.warn(`BorderLayer::assignBorderingLinksToSides() intersections.length > 2`)
				}
			}
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

	public override async addNodeIfFitting(node: Box|NodeWidget): Promise<{added: boolean}> {
		if (!(node instanceof NodeWidget)) {
			return {added: false}
		}
		return super.addNodeIfFitting(node)
	}

	public override async getTargetsOfNodeLinks(node: Box|NodeWidget): Promise<{side: LayerSide, position: LocalPosition}[]> {
		return [
			...await super.getTargetsOfNodeLinks(node),
			...await this.getOuterTargetsOfNodeLinks(node)
		]
	}

	public override async getOuterTargetsOfNodeLinks(node: Box|NodeWidget): Promise<{side: LayerSide, position: LocalPosition}[]> {
		const targets: {side: LayerSide, position: LocalPosition}[] = []

		for (const side of this.sides) {
			for (const linkWithIntersection of side.borderingLinks) {
				const link = linkWithIntersection.link
				let outsideEnd: LinkEnd
				if (link.from.isBoxInPath(node)) {
					outsideEnd = link.to
				} else if (link.to.isBoxInPath(node)) {
					outsideEnd = link.from
				} else {
					continue
				}
				
				let position: LocalPosition = await outsideEnd.getTargetPositionInManagingBoxCoords()
				if (outsideEnd.getManagingBox() !== this.box) {
					position = this.box.transform.outerCoordsRecursiveToLocal(outsideEnd.getManagingBox(), position)
				}
				
				targets.push({side: side.side, position})
			}
		}

		return targets
	}

	protected override updateExtremePositionsAlongSides(): void {
		// nothing yet
	}
}