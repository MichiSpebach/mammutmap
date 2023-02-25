import { Position } from './Position'

export class LocalPosition extends Position<LocalPosition> {
    public readonly percentX: number
    public readonly percentY: number

    public constructor(percentX: number, percentY: number) {
        super()
        this.percentX = percentX
        this.percentY = percentY
    }

    public getX(): number {
        return this.percentX
    }

    public getY(): number {
        return this.percentY
    }
}