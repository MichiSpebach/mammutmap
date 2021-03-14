
export class WayPointData {
  public static readonly THIS_BOX_ID: string = 'this' // TODO: remove and use id of baseBox?

  public boxId: string
  public x: number
  public y: number

  public constructor(boxId: string, x: number, y: number) {
    this.boxId = boxId
    this.x = x
    this.y = y
  }

}
