import { log } from '../logService'
import { Position } from './Position'

/** TODO: rename to DirectedLine or DirectedLineSegment? */
export class Line<POSITION extends Position<POSITION>> {

	public constructor(public readonly from: POSITION, public readonly to: POSITION) {}

	public elongate(elongationPerSide: number): Line<POSITION> {
		const direction: {x: number, y: number} = this.getDirection()
		return new Line<POSITION>(
			this.from.newMovedBy({x: -direction.x*elongationPerSide, y: -direction.y*elongationPerSide}),
			this.to.newMovedBy({x: direction.x*elongationPerSide, y: direction.y*elongationPerSide})
		)
	}

	public round(significantDigits: number): Line<POSITION> {
		return new Line<POSITION>(this.from.newRounded(significantDigits), this.to.newRounded(significantDigits))
	}

	/**
	 * @returns unit vector of length 1
	 */
	public getDirection(): {x: number, y: number} {
		const length: number = this.getLength()
		if (length === 0) {
			log.warning(`Line::getDirection() length is 0 for line ${JSON.stringify(this)}, returning {x: 0, y: 0}.`)
			return {x: 0, y: 0} // returns {x: NaN, y: NaN} otherwise which would result in NaN for every following calculation
		}
		return {
			x: this.getWidthCoordinateWise()/length,
			y: this.getHeightCoordinateWise()/length
		}
	}

	public getLength(): number {
		const width: number = this.getWidthCoordinateWise()
		const height: number = this.getHeightCoordinateWise()
		return Math.sqrt(width*width + height*height)
	}

	public getWidthCoordinateWise(): number {
		return this.to.getX() - this.from.getX()
	}

	public getHeightCoordinateWise(): number {
		return this.to.getY() - this.from.getY()
	}
}