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
import { ClientPosition } from './shape/ClientPosition'
import * as indexHtmlIds from './indexHtmlIds'
import { fileSystem } from './fileSystemAdapter'
import { Subscribers } from './pluginFacade'
import { mouseDownDragManager } from './mouseDownDragManager'

export const onMapLoaded: Subscribers<Map> = new Subscribers()
export const onMapRendered: Subscribers<Map> = new Subscribers()
export const onMapUnload: Subscribers<void> = new Subscribers()

export let map: Map|undefined

export function setMap(object: Map): void {
  if (map) {
    onMapUnload.callSubscribers() // TODO: call 'await unloadAndUnsetMap()' instead
  }

  map = object

  if (!map) {
    util.logWarning('cannot call onLoadedSubscribers because map is not set')
  } else {
    onMapLoaded.callSubscribers(map)
    onMapRendered.callSubscribers(map)
  }
}

export async function searchAndLoadMapCloseTo(folderPath: string): Promise<void> {
  const filePathsToLookForProjectSettings: string[] = generatePreferredProjectSettingsFilePaths(folderPath)
    .concat(generateAlternativeProjectSettingsFilePaths(folderPath))

  for (const projectSettingsFilePath of filePathsToLookForProjectSettings) {
    if (await fileSystem.doesDirentExistAndIsFile(projectSettingsFilePath)) {
      util.logInfo('found existing ProjectSettings at '+projectSettingsFilePath)
      try {
        await loadAndSetMap(await ProjectSettings.loadFromFileSystem(projectSettingsFilePath))
        return
      } catch (error) {
        util.logWarning('Failed to open ProjectSettings at '+projectSettingsFilePath+'. '+error)
      }
    }
  }

  util.logInfo('opening new project at '+folderPath)
  await loadAndSetMap(ProjectSettings.newWithDefaultData(util.joinPaths([folderPath, '/map/', ProjectSettings.preferredFileName])))
}

function generatePreferredProjectSettingsFilePaths(openedFolderPath: string): string[] {
  return generateFolderPathsToLookForProjectSettings(openedFolderPath).map((folderPath: string) => {
    return util.joinPaths([folderPath, ProjectSettings.preferredFileName])
  })
}

function generateAlternativeProjectSettingsFilePaths(openedFolderPath: string): string[] {
  let projectSettingsFilePaths: string[] = []
  for (const folderPath of generateFolderPathsToLookForProjectSettings(openedFolderPath)) {
    projectSettingsFilePaths = projectSettingsFilePaths.concat(
      ProjectSettings.alternativeFileNames.map((fileName: string) => {
        return util.joinPaths([folderPath, fileName])
      })
    )
  }
  return projectSettingsFilePaths
}

function generateFolderPathsToLookForProjectSettings(openedFolderPath: string): string[] {
  return [
    util.joinPaths([openedFolderPath, '/']),
    util.joinPaths([openedFolderPath, '/map/']),
    util.joinPaths([openedFolderPath, '/../']),
    util.joinPaths([openedFolderPath, '/../map/'])
  ]
}

export async function loadAndSetMap(projectSettings: ProjectSettings): Promise<void> {
  if (map) {
    await unloadAndUnsetMap()
  }

  map = new Map(indexHtmlIds.contentId, projectSettings)
  await onMapLoaded.callSubscribers(map) // TODO: add maximum await time or dialog to force continue in case of defective plugins

  await map.render()
  await onMapRendered.callSubscribers(map) // TODO: add maximum await time or dialog to force continue in case of defective plugins
}

export async function unloadAndUnsetMap(): Promise<void> {
  if (!map) {
    util.logWarning('cannot unload map because no map is loaded')
    return
  }
  await onMapUnload.callSubscribers() // TODO: add maximum await time or dialog to force continue in case of defective plugins
  await map.destruct()
  ensureMapUnloaded()
  map = undefined
}

function ensureMapUnloaded(): void {
  if (boxManager.getNumberOfBoxes() !== 0) {
    util.logWarning('Expected all boxes to be unloaded at this state, but there are '+boxManager.getNumberOfBoxes()+' boxes.')
  }
  if (renderManager.getPendingCommandsCount() !== 0) {
    util.logWarning('Expected no pending render commands at this state, but there are '+renderManager.getPendingCommandsCount()+' render commands.')
  }
  if (dom.getIpcChannelsCount() !== 0) {
    util.logInfo('There are '+dom.getIpcChannelsCount()+' ipcChannels at this state.')
  }
  if (DragManager.isDraggingInProgress()) {
    util.logWarning('Expected dragging not to be in progress at this state.')
    DragManager.clear()
  }
  if (ScaleManager.isScalingInProgress()) {
    util.logWarning('Expected scaling not to be in progress at this state.')
    ScaleManager.clear()
  }
  if (HoverManager.isHoveringInProgress()) {
    util.logWarning('Expected hovering not to be in progress at this state.')
    HoverManager.clear()
  }
}

export class Map {

  private static readonly hintToPreventMoving: string = 'Press CTRL to prevent moving'

  private readonly id: string
  private projectSettings: ProjectSettings
  private rootFolder: RootFolderBox
  private scalePercent: number = 100
  private marginTopPercent: number = 0
  private marginLeftPercent: number = 0
  private readonly mapRatioAdjusterSizePx: number = 600
  private moveState: {latestMousePosition: ClientPosition, prevented: boolean, movingStarted: boolean} | null = null

  public constructor(idToRenderIn: string, projectSettings: ProjectSettings) {
    this.id = idToRenderIn
    this.projectSettings = projectSettings
    this.rootFolder = new RootFolderBox(projectSettings, 'mapMover')
  }

  public async render(): Promise<void> {
    const rootFolderHtml = '<div id="'+this.rootFolder.getId()+'" style="width:100%; height:100%;"></div>'
    const mapMoverHtml = `<div id="mapMover">${rootFolderHtml}</div>`
    const mapRatioAdjusterStyle = `width:${this.mapRatioAdjusterSizePx}px;height:${this.mapRatioAdjusterSizePx}px;`
    const mapRatioAdjusterHtml = `<div id="mapRatioAdjuster" style="${mapRatioAdjusterStyle}">${mapMoverHtml}</div>`
    const mapHtml = `<div id="map" style="overflow:hidden; width:100%; height:100%;">${mapRatioAdjusterHtml}</div>`

    await renderManager.setContentTo(this.id, mapHtml)

    await Promise.all([
      this.updateStyle(),
      this.rootFolder.render(),
      renderManager.addWheelListenerTo('map', (delta: number, clientX: number, clientY: number) => this.zoom(-delta, clientX, clientY)),
      mouseDownDragManager.addDraggable(
        'map',
        (result: MouseEventResultAdvanced) => this.movestart(result),
        (position: ClientPosition, ctrlPressed: boolean) => this.move(position, ctrlPressed),
        (position: ClientPosition, ctrlPressed: boolean) => this.moveend()
      )
    ])
  }

  public async destruct(): Promise<void> {
    await this.rootFolder.unrenderIfPossible(true)
    await Promise.all([
      this.rootFolder.destruct(),
      renderManager.removeEventListenerFrom('map', 'wheel'),
      mouseDownDragManager.removeDraggable('map')
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
    if (this.moveState) {
      util.logWarning('movestart should be called before move')
    }

    this.moveState = {
      latestMousePosition: eventResult.position,
      prevented: eventResult.cursor !== 'auto' && eventResult.cursor !== 'default' || eventResult.ctrlPressed,
      movingStarted: false
    }
  }

  private async move(position: ClientPosition, ctrlPressed: boolean): Promise<void> {
    if (!this.moveState) {
      util.logWarning('move should be called between movestart and moveend')
      return
    }

    if (!this.moveState.movingStarted) {
      this.moveState.movingStarted = true // TODO: use treshold to block other mouse events only if moved some distance?
      this.updateMouseEventBlockerAndHintToPreventMoving()
    }

    if (this.moveState.prevented) {
      return
    }
    if (ctrlPressed) {
      this.moveState.prevented = true
      this.updateMouseEventBlockerAndHintToPreventMoving()
      return
    }

    const marginTopOffsetPx: number = position.y - this.moveState.latestMousePosition.y
    const marginLeftOffsetPx: number = position.x - this.moveState.latestMousePosition.x

    const marginTopOffsetPercent: number = marginTopOffsetPx / (this.mapRatioAdjusterSizePx/100)
    const marginLeftOffsetPercent: number = marginLeftOffsetPx / (this.mapRatioAdjusterSizePx/100)

    this.marginTopPercent += marginTopOffsetPercent
    this.marginLeftPercent += marginLeftOffsetPercent

    this.moveState.latestMousePosition = position

    await this.updateStyle(RenderPriority.RESPONSIVE)
    await this.rootFolder.render()
  }

  private async moveend(): Promise<void> {
    if (!this.moveState) {
      util.logWarning('moveend should be called after move')
    }

    this.moveState = null
    this.updateMouseEventBlockerAndHintToPreventMoving()
  }

  private updateMouseEventBlockerAndHintToPreventMoving(): void {
    const visible: boolean = !!this.moveState && !this.moveState.prevented
    util.setMouseEventBlockerScreenOverlay(visible, RenderPriority.RESPONSIVE)
    util.setHint(Map.hintToPreventMoving, visible)
  }

  private async updateStyle(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    let basicStyle: string = 'position:relative;'
    let offsetStyle: string = 'top:' + this.marginTopPercent + '%;left:' + this.marginLeftPercent + '%;'
    let scaleStyle: string = 'width:' + this.scalePercent + '%;height:' + this.scalePercent + '%;'

    await renderManager.setStyleTo('mapMover', basicStyle + offsetStyle + scaleStyle, priority)
    this.rootFolder.clearCachedClientRect()
  }

}
