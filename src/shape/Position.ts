export abstract class Position<POSITION extends Position<POSITION>> {

    public abstract getX(): number

    public abstract getY(): number

    public isBetweenCoordinateWise(line: { from: POSITION, to: POSITION }): boolean {
        const leftLineEnd: number = Math.min(line.from.getX(), line.to.getX())
        const rightLineEnd: number = Math.max(line.from.getX(), line.to.getX())
        const topLineEnd: number = Math.min(line.from.getY(), line.to.getY())
        const bottomLineEnd: number = Math.max(line.from.getY(), line.to.getY())
        return this.getX() >= leftLineEnd && this.getX() <= rightLineEnd && this.getY() >= topLineEnd && this.getY() <= bottomLineEnd
    }

    public equals(other: POSITION): boolean {
        return other.getX() === this.getX() && other.getY() === this.getY()
    }

}