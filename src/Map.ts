import * as util from './util'
import { dom } from './domAdapter'
import { renderManager } from './RenderManager'
import { settings } from './Settings'
import { DragManager } from './DragManager'
import { ScaleManager } from './ScaleManager'
import { HoverManager } from './HoverManager'
import { boxManager } from './box/BoxManager'
import { RootFolderBox } from './box/RootFolderBox'

export let map: Map|undefined

export function setMap(object: Map): void {
  map = object
}

export async function loadAndSetMap(sourceRootPath: string, mapRootPath: string): Promise<void> {
  if (map) {
    await unloadAndUnsetMap()
  }
  map = await Map.new('content', sourceRootPath, mapRootPath)
}

export async function unloadAndUnsetMap(): Promise<void> {
  if (!map) {
    util.logWarning('cannot unload map because no map is loaded')
    return
  }
  await map.destruct()
  checkMapUnloaded()
  clearManagers()
  map = undefined
}

function checkMapUnloaded(): void {
  if (boxManager.getNumberOfBoxes() != 0) {
    util.logWarning('expected all boxes to be unloaded at this state, but there are '+boxManager.getNumberOfBoxes()+' boxes.')
  }
  if (dom.getIpcChannelsCount() != 0) {
    util.logWarning('expected that no ipcChannels exist at this state, but there are '+dom.getIpcChannelsCount()+' ipcChannels')
  }
}

function clearManagers(): void {
  DragManager.clear()
  ScaleManager.clear()
  HoverManager.clear()
  renderManager.clear()
}

export class Map {
  private rootFolder: RootFolderBox
  private scalePercent: number = 100
  private marginTopPercent: number = 0
  private marginLeftPercent: number = 0
  private readonly mapRatioAdjusterSizePx: number = 600

  public static async new(idToRenderIn: string, sourceRootPath: string, mapRootPath: string): Promise<Map> {
     return new Map(idToRenderIn, await RootFolderBox.new(sourceRootPath, mapRootPath))
  }

  private constructor(idToRenderIn: string, root: RootFolderBox) {
    renderManager.setContentTo(idToRenderIn, '<div id="map" style="overflow:hidden; width:100%; height:100%;"></div>')
    renderManager.setContentTo('map', '<div id="mapRatioAdjuster" style="width:'+this.mapRatioAdjusterSizePx+'px; height:'+this.mapRatioAdjusterSizePx+'px;"></div>')
    renderManager.setContentTo('mapRatioAdjuster', '<div id="mapMover"></div>')
    renderManager.setContentTo('mapMover', '<div id="'+root.getId()+'" style="width:100%; height:100%;"></div>')
    this.updateStyle()

    //this.addBoxes()
    this.rootFolder = root
    const renderFinished: Promise<void> = this.rootFolder.render()

    renderFinished.then(() => {
      dom.addWheelListenerTo('map', (delta: number, clientX: number, clientY: number) => this.zoom(-delta, clientX, clientY))
    })
  }

  public async destruct(): Promise<void> {
    await this.rootFolder.destruct()
    dom.removeEventListenerFrom('map', 'wheel')
    await renderManager.remove('map')
  }

  public getRootFolder(): RootFolderBox {
    return this.rootFolder
  }

  private addBoxes(): void {
    this.addBox('green');this.addBox('blue');this.addBox('green');this.addBox('blue')
    this.addBox('blue');this.addBox('green');this.addBox('blue');this.addBox('green')
    this.addBox('green');this.addBox('blue');this.addBox('green');this.addBox('blue')
    this.addBox('blue');this.addBox('green');this.addBox('blue');this.addBox('green')
  }

  private addBox(color: string) {
    renderManager.addContentTo(this.rootFolder.getId(), '<div style="display:inline-block;width:25%;height:25%;margin:0px;padding:0px;background-color:' + color + ';"><div>')
  }

  private async zoom(delta: number, clientX: number, clientY: number): Promise<void> {
    let clientYPercent: number = 100 * clientY / this.mapRatioAdjusterSizePx
    let clientXPercent: number = 100 * clientX / this.mapRatioAdjusterSizePx
    let scaleChange: number = this.scalePercent * (delta/1500) * settings.getZoomSpeed()

    this.marginTopPercent -= scaleChange * (clientYPercent - this.marginTopPercent) / this.scalePercent
    this.marginLeftPercent -= scaleChange * (clientXPercent - this.marginLeftPercent) / this.scalePercent
    this.scalePercent += scaleChange

    await this.updateStyle(2)
    await this.rootFolder.render()
  }

  private async updateStyle(priority: number = 1): Promise<void> {
    let basicStyle: string = 'position:relative;'
    let offsetStyle: string = 'top:' + this.marginTopPercent + '%;left:' + this.marginLeftPercent + '%;'
    let scaleStyle: string = 'width:' + this.scalePercent + '%;height:' + this.scalePercent + '%;'

    await renderManager.setStyleTo('mapMover', basicStyle + offsetStyle + scaleStyle, priority)
  }

}
