import { Position } from './Position'

export class ClientPosition extends Position<ClientPosition> {
    public readonly x: number
    public readonly y: number

    protected /*static*/ override new(x: number, y: number): ClientPosition {
        return new ClientPosition(x, y)
    }

    public constructor(x: number, y: number) {
        super()
        this.x = x
        this.y = y
    }

    public override getX(): number {
        return this.x
    }

    public override getY(): number {
        return this.y
    }

    public calculateDistanceTo(other: ClientPosition): number {
        return Math.sqrt((this.x - other.x) * (this.x - other.x) + (this.y - other.y) * (this.y - other.y))
    }

}