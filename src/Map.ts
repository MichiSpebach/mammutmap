import * as util from './util'
import { DirectoryBox } from './DirectoryBox'

export class Map {
  private rootDirectory: DirectoryBox
  private scalePercent: number = 100

  public constructor() {
    util.setContent('<div id="map" style="overflow:hidden; width:100%; height:100%"></div>')
    util.setContentTo('map', '<div id="mapRatioAdjuster"></div>')
    util.setContentTo('mapRatioAdjuster', '<div id="root"></div>')
    this.updateStyle()

    this.rootDirectory = new DirectoryBox(null, './src', 'root')
    this.rootDirectory.render(99, 99)

    util.addWheelListenerTo('map', (delta) => this.zoom(delta))
  }

  private zoom(delta: number): void {
    this.scalePercent -= this.scalePercent * (delta/1000)
    util.logInfo('zoom: ' + this.scalePercent)
    this.updateStyle()
  }

  private updateStyle() {
    util.setStyleTo('mapRatioAdjuster', 'width:' + this.scalePercent + '%;height:' + this.scalePercent + '%;')
  }

}
