import * as util from './util'

export class BoxData {
  public x: number | null | undefined
  public y: number | null | undefined
  public width: number | null | undefined
  public height: number | null | undefined

  public validate(): void {
    this.warnIf(this.x == null, 'x is null')
    this.warnIf(this.y == null, 'y is null')
    this.warnIf(this.width == null, 'width is null')
    this.warnIf(this.height == null, 'height is null')

    this.warnIf(this.x == undefined, 'x is undefined')
    this.warnIf(this.y == undefined, 'y is undefined')
    this.warnIf(this.width == undefined, 'width is undefined')
    this.warnIf(this.height == undefined, 'height is undefined')

    if (this.x == null || this.y == null || this.width == null || this.height == null) {
      return
    }
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
}
