import * as util from '../util'

export class BoxMapData {
  public readonly id: string
  public x: number
  public y: number
  public width: number
  public height: number

  public static buildDefault(): BoxMapData {
    return new BoxMapData(util.generateId(), 10, 10, 80, 80)
  }

  public static buildFromJson(json: string ): BoxMapData /*| SyntaxError*/ {
    const parsedData: BoxMapData = JSON.parse(json) // parsed object has no functions

    let id: string = parsedData.id // TODO: delete this later
    if (id == null) {
      id = util.generateId()
    }

    return new BoxMapData(id, parsedData.x, parsedData.y, parsedData.width, parsedData.height)
  }

  public constructor(id: string, x: number, y: number, width: number, height: number) {
    this.id = id
    this.x = x
    this.y = y
    this.width = width
    this.height = height

    this.validate()
  }

  public validate(): void {
    this.warnIf(this.id == null, 'id is null')
    this.warnIf(this.id == undefined, 'id is undefined')
    this.warnIf(this.id == '', 'id is empty')

    this.warnIf(this.x == null, 'x is null')
    this.warnIf(this.y == null, 'y is null')
    this.warnIf(this.width == null, 'width is null')
    this.warnIf(this.height == null, 'height is null')

    this.warnIf(this.x == undefined, 'x is undefined')
    this.warnIf(this.y == undefined, 'y is undefined')
    this.warnIf(this.width == undefined, 'width is undefined')
    this.warnIf(this.height == undefined, 'height is undefined')

    this.warnIf(this.x < 0, 'x is less than 0')
    this.warnIf(this.y < 0, 'y is less than 0')
    this.warnIf(this.width <= 0, 'width is not positive')
    this.warnIf(this.height <= 0, 'height is not positive')
    this.warnIf(this.x + this.width > 100, 'sum of x and width is greater than 100')
    this.warnIf(this.y + this.height > 100, 'sum of y and height is greater than 100')
  }

  private warnIf(condition: boolean, message: string) {
    if (condition) {
      this.warn(message)
    }
  }

  private warn(message: string): void {
    util.logWarning('BoxData: ' + message)
  }

  public toJson(): string {
    return JSON.stringify(this)
  }
}
