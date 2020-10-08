import * as util from './util'
import { DirectoryBox } from './DirectoryBox'

export class Map {
  private rootDirectory: DirectoryBox

  public constructor() {
    util.setContent('<div id="map""></div>')

    this.rootDirectory = new DirectoryBox(null, './src', 'map')
    this.rootDirectory.render(99, 99)

    util.addWheelListenerTo('map', this.zoom)
  }

  private zoom(delta: number): void {
    util.logInfo("zooming " + delta)
  }

}
