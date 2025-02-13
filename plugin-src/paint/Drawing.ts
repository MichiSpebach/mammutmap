import { Box } from '../../dist/core/box/Box'
import { renderManager } from '../../dist/core/renderEngine/renderManager'
import { ClientPosition } from '../../dist/core/shape/ClientPosition'
import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import { util } from '../../dist/core/util/util'

export class Drawing {

	public readonly id = 'drawing-'+util.generateId()

	private points: LocalPosition[] = []

	public static async new(parent: Box, color: string, position: ClientPosition): Promise<Drawing> {
		const drawing = new Drawing(parent, color)
		await renderManager.addElementTo(drawing.parent.getId(), {
			type: 'svg',
			id: drawing.id,
			viewBox: '0 0 100 100',
			preserveAspectRatio: 'none',
			style: {
				position: 'absolute',
				top: '0',
				width: '100%',
				height: '100%',
				overflow: 'visible',
				pointerEvents: 'none'
			}
		})
		drawing.draw(position)
		return drawing
	}

	private constructor(
		public readonly parent: Box,
		public readonly color: string
	) {}

	public async draw(position: ClientPosition): Promise<void> {
		const positionInBoxCoords: LocalPosition = await this.parent.transform.clientToLocalPosition(position)
		this.points.push(positionInBoxCoords)

		const points: string = this.points.map(point => `${point.percentX},${point.percentY}`).join(' ')
		await renderManager.setElementTo(this.id, {
			type: 'polyline',
			points,
			style: {
				fill: 'none',
				stroke: this.color,
				strokeWidth: '2px',
				vectorEffect: 'non-scaling-stroke',
				strokeLinecap: 'round',
				pointerEvents: 'stroke'
			}
		})
	}
}