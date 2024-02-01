import { Position } from './Position'

export class LocalPosition extends Position<LocalPosition> {
    public readonly percentX: number
    public readonly percentY: number

    protected /*static*/ override new(x: number, y: number): LocalPosition {
        return new LocalPosition(x, y)
    }

    public constructor(percentX: number, percentY: number) {
        super()
        this.percentX = percentX
        this.percentY = percentY
    }

    public override getX(): number {
        return this.percentX
    }

    public override getY(): number {
        return this.percentY
    }
}