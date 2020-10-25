import * as dom from './domAdapter'
import { Path } from './Path'
import { DirectoryBox } from './box/DirectoryBox'

export class Map {
  private rootDirectory: DirectoryBox
  private scalePercent: number = 100
  private marginTopPercent: number = 0
  private marginLeftPercent: number = 0
  private readonly mapRatioAdjusterSizePx: number = 600

  public constructor() {
    dom.setContent('<div id="map" style="overflow:hidden; width:100%; height:100%;"></div>')
    dom.setContentTo('map', '<div id="mapRatioAdjuster" style="width:' + this.mapRatioAdjusterSizePx + 'px; height:' + this.mapRatioAdjusterSizePx + 'px;"></div>')
    dom.setContentTo('mapRatioAdjuster', '<div id="mapMover"></div>')
    dom.setContentTo('mapMover', '<div id="root" style="width:100%; height:100%;"></div>')
    this.updateStyle()

    //this.addBoxes()
    let rootPath: Path = Path.buildRoot('./src', './map')
    this.rootDirectory = new DirectoryBox(rootPath, 'root')
    this.rootDirectory.render()

    dom.addWheelListenerTo('map', (delta: number, clientX: number, clientY: number) => this.zoom(-delta, clientX, clientY))
  }

  private addBoxes(): void {
    this.addBox('green');this.addBox('blue');this.addBox('green');this.addBox('blue')
    this.addBox('blue');this.addBox('green');this.addBox('blue');this.addBox('green')
    this.addBox('green');this.addBox('blue');this.addBox('green');this.addBox('blue')
    this.addBox('blue');this.addBox('green');this.addBox('blue');this.addBox('green')
  }

  private addBox(color: string) {
    dom.addContentTo('root', '<div style="display:inline-block;width:25%;height:25%;margin:0px;padding:0px;background-color:' + color + ';"><div>')
  }

  private zoom(delta: number, clientX: number, clientY: number): void {
    let clientYPercent: number = 100 * clientY / this.mapRatioAdjusterSizePx
    let clientXPercent: number = 100 * clientX / this.mapRatioAdjusterSizePx
    let scaleChange: number = this.scalePercent * (delta/500)

    this.marginTopPercent -= scaleChange * (clientYPercent - this.marginTopPercent) / this.scalePercent
    this.marginLeftPercent -= scaleChange * (clientXPercent - this.marginLeftPercent) / this.scalePercent
    this.scalePercent += scaleChange

    this.updateStyle()
  }

  private async updateStyle() {
    let basicStyle: string = 'position:relative;'
    let offsetStyle: string = 'margin-top:' + this.marginTopPercent + '%;margin-left:' + this.marginLeftPercent + '%;'
    let scaleStyle: string = 'width:' + this.scalePercent + '%;height:' + this.scalePercent + '%;'

    dom.setStyleTo('mapMover', basicStyle + offsetStyle + scaleStyle)
  }

}
