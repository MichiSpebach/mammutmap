import { NodeWidget } from '../node/NodeWidget'
import { RenderPriority } from '../RenderManager'
import { ClientPosition } from '../shape/ClientPosition'
import { LocalPosition } from '../shape/LocalPosition'
import { util } from '../util/util'
import { Box } from './Box'
import { Grid, grid } from './Grid'

export class BoxRaster {

	public constructor(
		private readonly referenceBox: Box
	) {}
	
	public getId(): string {
		return this.referenceBox.getId()+'Raster'
	}

	public async attachGrid(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
		if (this.referenceBox.getRenderState().isUnrenderInProgress()) {
			util.logWarning('prevented attaching grid to box that gets unrendered') // TODO: only to check that this gets triggered, remove
			return
		}
		await Promise.all([
			grid.renderInto(this.getId(), priority),
			grid.updateActiveLayers(await this.referenceBox.getClientRect())
		])
	}

	public async updateGridIfAttached(): Promise<void> {
		if (grid.getIdRenderedInto() !== this.getId()) {
			return
		}
		await grid.updateActiveLayers(await this.referenceBox.getClientRect())
	}

	public async detachGrid(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
		await grid.unrenderFrom(this.getId(), priority)
	}
	
	public async getSnapTargetAt(position: ClientPosition): Promise<{snapTarget: Box|NodeWidget, snapPosition: ClientPosition}> {
		const snapPosition: LocalPosition = Grid.roundToGridPosition(await this.referenceBox.transform.clientToLocalPosition(position), await this.referenceBox.getClientRect(), true)
		const clientPositionSnapped: ClientPosition = await this.referenceBox.transform.localToClientPosition(snapPosition)
		const childAtSnapPosition: Box|NodeWidget|undefined = await this.referenceBox.findChildAtClientPosition(clientPositionSnapped)
		if (!childAtSnapPosition) {
			return {snapTarget: this.referenceBox, snapPosition: clientPositionSnapped}
		}
		if (childAtSnapPosition instanceof NodeWidget) {
			return {snapTarget: childAtSnapPosition, snapPosition: clientPositionSnapped}
		}
		return childAtSnapPosition.raster.getSnapTargetAt(position)
	}

}