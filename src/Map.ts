import { util } from './util'
import { dom, MouseEventResultAdvanced } from './domAdapter'
import { renderManager, RenderPriority } from './RenderManager'
import { settings } from './Settings'
import { DragManager } from './DragManager'
import { ScaleManager } from './ScaleManager'
import { HoverManager } from './HoverManager'
import { boxManager } from './box/BoxManager'
import { RootFolderBox } from './box/RootFolderBox'
import { ProjectSettings } from './ProjectSettings'
import { ClientPosition } from './box/Transform'
import * as indexHtmlIds from './indexHtmlIds'

export let map: Map|undefined

const onLoadedSubscribers: ((map: Map) => void)[] = []
const onUnloadSubscribers: (() => void)[] = []

export function setMap(object: Map): void {
  if (map) {
    callOnUnloadSubscribers()
  }
  map = object
  callOnLoadedSubscribers()
}

export async function loadAndSetMap(projectSettings: ProjectSettings): Promise<void> {
  if (map) {
    await unloadAndUnsetMap()
  }
  map = await Map.new('content', projectSettings)
  callOnLoadedSubscribers()
}

export async function unloadAndUnsetMap(): Promise<void> {
  if (!map) {
    util.logWarning('cannot unload map because no map is loaded')
    return
  }
  callOnUnloadSubscribers()
  await map.destruct()
  checkMapUnloaded()
  clearManagers()
  map = undefined
}

export function subscribe(onLoaded: (map: Map) => void, onUnload: () => void): void {
  onLoadedSubscribers.push(onLoaded)
  onUnloadSubscribers.push(onUnload)
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

function callOnLoadedSubscribers(): void {
  if (!map) {
    util.logWarning('cannot callOnLoadedSubscribers because map is not set')
    return
  }
  for (const subscriber of onLoadedSubscribers) {
    subscriber(map)
  }
}

function callOnUnloadSubscribers(): void {
  for (const subscriber of onUnloadSubscribers) {
    subscriber()
  }
}

export class Map {

  private static readonly hintToPreventMoving: string = 'Press CTRL to prevent moving'

  private projectSettings: ProjectSettings
  private rootFolder: RootFolderBox
  private scalePercent: number = 100
  private marginTopPercent: number = 0
  private marginLeftPercent: number = 0
  private readonly mapRatioAdjusterSizePx: number = 600
  private latestMousePositionWhenMoving: ClientPosition|undefined

  public static async new(idToRenderIn: string, projectSettings: ProjectSettings): Promise<Map> {
    const map = new Map(idToRenderIn, projectSettings, await RootFolderBox.new(projectSettings, 'mapMover'))
    await Promise.all([
      map.rootFolder.render(),
      renderManager.addWheelListenerTo('map', (delta: number, clientX: number, clientY: number) => map.zoom(-delta, clientX, clientY)),
      renderManager.addEventListenerAdvancedTo('map', 'mousedown', (result: MouseEventResultAdvanced) => map.movestart(result)),
    ])
    return map
  }

  private constructor(idToRenderIn: string, projectSettings: ProjectSettings, root: RootFolderBox) {
    this.projectSettings = projectSettings
    this.rootFolder = root

    renderManager.setContentTo(idToRenderIn, '<div id="map" style="overflow:hidden; width:100%; height:100%;"></div>')
    renderManager.setContentTo('map', '<div id="mapRatioAdjuster" style="width:'+this.mapRatioAdjusterSizePx+'px; height:'+this.mapRatioAdjusterSizePx+'px;"></div>')
    renderManager.setContentTo('mapRatioAdjuster', '<div id="mapMover"></div>')
    renderManager.setContentTo('mapMover', '<div id="'+root.getId()+'" style="width:100%; height:100%;"></div>')
    this.updateStyle()
  }

  public async destruct(): Promise<void> {
    await this.rootFolder.destruct()
    await Promise.all([
      renderManager.removeEventListenerFrom('map', 'wheel'),
      renderManager.removeEventListenerFrom('map', 'mousedown')
    ])
    await renderManager.remove('map')
  }

  public getProjectSettings(): ProjectSettings {
    return this.projectSettings
  }

  public getRootFolder(): RootFolderBox {
    return this.rootFolder
  }

  private async zoom(delta: number, clientX: number, clientY: number): Promise<void> {
    let clientYPercent: number = 100 * clientY / this.mapRatioAdjusterSizePx
    let clientXPercent: number = 100 * clientX / this.mapRatioAdjusterSizePx
    let scaleChange: number = this.scalePercent * (delta/1500) * settings.getZoomSpeed()

    this.marginTopPercent -= scaleChange * (clientYPercent - this.marginTopPercent) / this.scalePercent
    this.marginLeftPercent -= scaleChange * (clientXPercent - this.marginLeftPercent) / this.scalePercent
    this.scalePercent += scaleChange

    await this.updateStyle(RenderPriority.RESPONSIVE)
    await this.rootFolder.render()
    util.logDebug(`zooming ${delta} finished at x=${clientX} and y=${clientY}`)
  }

  private async movestart(eventResult: MouseEventResultAdvanced): Promise<void> {
    if (eventResult.cursor !== 'auto' && eventResult.cursor !== 'default' || eventResult.ctrlPressed) {
      return
    }
    if (this.latestMousePositionWhenMoving) {
      util.logWarning('movestart should be called before move')
    }

    this.latestMousePositionWhenMoving = new ClientPosition(eventResult.clientX, eventResult.clientY)
    await Promise.all([
      renderManager.addEventListenerTo(indexHtmlIds.bodyId, 'mousemove', (clientX: number, clientY: number, ctrlPressed: boolean) => this.move(clientX, clientY, ctrlPressed), RenderPriority.RESPONSIVE),
      renderManager.addEventListenerTo(indexHtmlIds.bodyId, 'mouseup', (clientX: number, clientY: number, ctrlPressed: boolean) => this.moveend(), RenderPriority.RESPONSIVE),
      renderManager.addEventListenerTo(indexHtmlIds.bodyId, 'mouseleave', (clientX: number, clientY: number, ctrlPressed: boolean) => this.moveend(), RenderPriority.RESPONSIVE)
    ])
    util.setHint(Map.hintToPreventMoving, true)
  }

  private async move(clientX: number, clientY: number, ctrlPressed: boolean): Promise<void> {
    if (ctrlPressed) {
      await this.moveend()
      return
    }
    if (!this.latestMousePositionWhenMoving) {
      util.logWarning('move should be called between movestart and moveend')
      return
    }

    const marginTopOffsetPx: number = clientY - this.latestMousePositionWhenMoving.y
    const marginLeftOffsetPx: number = clientX - this.latestMousePositionWhenMoving.x

    const marginTopOffsetPercent: number = marginTopOffsetPx / (this.mapRatioAdjusterSizePx/100)
    const marginLeftOffsetPercent: number = marginLeftOffsetPx / (this.mapRatioAdjusterSizePx/100)

    this.marginTopPercent += marginTopOffsetPercent
    this.marginLeftPercent += marginLeftOffsetPercent

    this.latestMousePositionWhenMoving = new ClientPosition(clientX, clientY)

    await this.updateStyle(RenderPriority.RESPONSIVE)
    await this.rootFolder.render()
  }

  private async moveend(): Promise<void> {
    if (!this.latestMousePositionWhenMoving) {
      util.logWarning('moveend should be called after move')
    }

    await Promise.all([
      renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mousemove', RenderPriority.RESPONSIVE),
      renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mouseup', RenderPriority.RESPONSIVE),
      renderManager.removeEventListenerFrom(indexHtmlIds.bodyId, 'mouseleave', RenderPriority.RESPONSIVE)
    ])
    this.latestMousePositionWhenMoving = undefined
    util.setHint(Map.hintToPreventMoving, false)
  }

  private async updateStyle(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    let basicStyle: string = 'position:relative;'
    let offsetStyle: string = 'top:' + this.marginTopPercent + '%;left:' + this.marginLeftPercent + '%;'
    let scaleStyle: string = 'width:' + this.scalePercent + '%;height:' + this.scalePercent + '%;'

    await renderManager.setStyleTo('mapMover', basicStyle + offsetStyle + scaleStyle, priority)
    this.rootFolder.clearCachedClientRect()
  }

}
