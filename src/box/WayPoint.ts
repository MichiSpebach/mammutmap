
export class WayPoint {
  public static readonly THIS_BOX_ID: string = 'this'

  public readonly boxId: string
  public x: number
  public y: number

  public constructor(boxId: string, x: number, y: number) {
    this.boxId = boxId
    this.x = x
    this.y = y
  }

}
