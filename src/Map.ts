import * as util from './util'
import { DirectoryBox } from './DirectoryBox'

export class Map {
  private rootDirectory: DirectoryBox
  private scalePercent: number = 100
  private marginTop: number = 0
  private marginLeft: number = 0
  private size: {width: number, height: number}

  public constructor() {
    util.setContent('<div id="map" style="overflow:hidden; width:100%; height:100%;"></div>')
    //util.setContentTo('map', '<div id="mapRatioAdjuster" style="width:500px; height:500px;"></div>')
    util.setContentTo('map', '<div id="mapRatioAdjuster" style="width:100%; height:100%;"></div>')
    util.setContentTo('mapRatioAdjuster', '<div id="mapMover"></div>')
    util.setContentTo('mapMover', '<div id="root"></div>')
    this.updateStyle()

    this.addBox('display:inline-block;width:25%;height:800px;background-color:green;')
    this.addBox('display:inline-block;width:25%;height:800px;background-color:blue;')
    this.addBox('display:inline-block;width:25%;height:800px;background-color:green;')
    this.addBox('display:inline-block;width:25%;height:800px;background-color:blue;')
    //this.rootDirectory = new DirectoryBox(null, './src', 'root')
    //this.rootDirectory.render(99, 99)

    util.addWheelListenerTo('map', (delta: number, clientX: number, clientY: number) => this.zoom(-delta, clientX, clientY))
  }

  private addBox(style: string) {
    util.addContentTo('root', '<div style="' + style + '"><div>')
  }

  private zoom(delta: number, clientX: number, clientY: number): void {
    let scaleChange: number = this.scalePercent * (delta/1000)
    let clientXPercent: number = 100 * clientX / this.size.width

    util.logInfo('clientX: ' + clientX + ' marginLeft: ' + this.marginLeft + ' scale: ' + this.scalePercent + ' scaleChange: ' + scaleChange)
    util.logInfo("mapWidth: " + this.size.width)
    this.marginLeft -= scaleChange * ((clientXPercent - this.marginLeft) / this.scalePercent)
    this.scalePercent += scaleChange

    this.updateStyle()
  }

  private async updateStyle() {
    util.getSizeOf('map').then(size => this.size = size)

    let offsetStyle: string = 'margin-top:' + this.marginTop + '%;margin-left:' + this.marginLeft + '%;'
    let scaleStyle: string = 'width:' + this.scalePercent + '%;height:' + this.scalePercent + '%;'

    util.setStyleTo('mapMover', offsetStyle + scaleStyle)
  }

}
