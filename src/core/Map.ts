import { util } from './util/util'
import { dom, MouseEventResultAdvanced } from './domAdapter'
import { renderManager, RenderPriority } from './RenderManager'
import { settings } from './settings/settings'
import { relocationDragManager } from './RelocationDragManager'
import { ScaleManager } from './ScaleManager'
import { HoverManager } from './HoverManager'
import { boxManager } from './box/BoxManager'
import { RootFolderBox } from './box/RootFolderBox'
import { ProjectSettings } from './ProjectSettings'
import { ClientPosition } from './shape/ClientPosition'
import * as indexHtmlIds from './indexHtmlIds'
import { fileSystem } from './fileSystemAdapter'
import { Subscribers } from './util/Subscribers'
import { mouseDownDragManager } from './mouseDownDragManager'
import { RenderElement } from './util/RenderElement'
import { LocalPosition } from './shape/LocalPosition'
import { ClientRect } from './ClientRect'
import { BoxWatcher } from './box/BoxWatcher'
import { Box } from './box/Box'
import { log } from './logService'
import { BoxContext } from './box/BoxContext'
import { LocalRect } from './LocalRect'

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
  if (relocationDragManager.isDraggingInProgress()) {
    util.logWarning('Expected dragging not to be in progress at this state.')
    relocationDragManager.clear()
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
  private readonly mapId: string = 'map'
  private readonly mapRatioAdjusterId: string = 'mapRatioAdjuster'
  private readonly projectSettings: ProjectSettings
  private readonly rootFolder: RootFolderBox
  /** @deprecated calculate dynamically instead */
  private readonly mapRatioAdjusterSizePx: number = 600
  private moveState: {latestMousePosition: ClientPosition, prevented: boolean, movingStarted: boolean} | null = null
  private devStats: RenderElement|undefined
  private cachedMapClientRect: ClientRect|null = null
  private cachedMapRatioAdjusterClientRect: ClientRect|null = null

  public constructor(idToRenderIn: string, projectSettings: ProjectSettings) {
    this.id = idToRenderIn
    this.projectSettings = projectSettings
    const boxContext: BoxContext = {projectSettings, getMapClientRect: () => this.getMapClientRect()}
    this.rootFolder = new RootFolderBox(boxContext, 'mapRatioAdjuster')
  }

  public async render(): Promise<void> {
    const mapHtml = `<div id="${this.mapId}" style="overflow:hidden; width:100%; height:100%;"></div>`
    await renderManager.setContentTo(this.id, mapHtml)

    let mapRatioAdjusterStyle: string = 'position:relative;'
    if (settings.getBoolean('positionMapOnTopLeft')) {
      mapRatioAdjusterStyle += `width:${this.mapRatioAdjusterSizePx}px;height:${this.mapRatioAdjusterSizePx}px;`
    } else {
      const mapClientRect: ClientRect = await this.getMapClientRect()
      const mapRatioAdjusterSizePx: number = Math.min(mapClientRect.width, mapClientRect.height) * 0.95
      mapRatioAdjusterStyle += `width:${mapRatioAdjusterSizePx}px;height:${mapRatioAdjusterSizePx}px;left:50%;top:50%;transform:translate(-50%,-50%);`
    }
    const rootFolderHtml = '<div id="'+this.rootFolder.getId()+'" style="width:100%; height:100%;"></div>'
    const mapRatioAdjusterHtml = `<div id="${this.mapRatioAdjusterId}" style="${mapRatioAdjusterStyle}">${rootFolderHtml}</div>`
    await renderManager.setContentTo(this.mapId, mapRatioAdjusterHtml)

    await Promise.all([
      this.rootFolder.render(),
      renderManager.addWheelListenerTo(this.mapId, (delta: number, clientX: number, clientY: number) => this.zoom(-delta, clientX, clientY)),
      mouseDownDragManager.addDraggable({
        elementId: this.mapId,
        onDragStart: (result: MouseEventResultAdvanced) => this.movestart(result),
        onDrag: (position: ClientPosition, ctrlPressed: boolean) => this.move(position, ctrlPressed),
        onDragEnd: (position: ClientPosition, ctrlPressed: boolean) => this.moveend()
      }),
      relocationDragManager.addDropZone(this.mapId),
      renderManager.addEventListenerTo(this.mapId, 'dblclick', () => this.rootFolder.site.zoomToFit({animationIfAlreadyFitting: true}))
    ])
  }

  public async destruct(): Promise<void> {
    await this.rootFolder.unrenderIfPossible(true)
    await Promise.all([
      this.rootFolder.destruct(),
      renderManager.removeEventListenerFrom(this.mapId, 'wheel'),
      mouseDownDragManager.removeDraggable(this.mapId),
      relocationDragManager.removeDropZone(this.mapId),
      renderManager.removeEventListenerFrom(this.mapId, 'dblclick')
    ])
    await renderManager.remove(this.mapId)
  }

  public getProjectSettings(): ProjectSettings {
    return this.projectSettings
  }

  public getRootFolder(): RootFolderBox {
    return this.rootFolder
  }

  public async getBoxBySourcePathAndRenderIfNecessary(
    path: string, 
    options?: {ignoreFileEndings?: boolean, onlyReturnWarnings?: boolean, foreachBoxInPath?: (box: Box) => void}
  ): Promise<{boxWatcher?: BoxWatcher, warnings?: string[]}> {
    if (util.normalizePath(path) === util.normalizePath(this.rootFolder.getSrcPath())) {
      return {boxWatcher: await BoxWatcher.newAndWatch(this.rootFolder)}
    }
    return this.rootFolder.getBoxBySourcePathAndRenderIfNecessary(path, options)
  }

  private async getMapClientRect(): Promise<ClientRect> {
    if (!this.cachedMapClientRect) {
      this.cachedMapClientRect = await renderManager.getClientRectOf(this.mapId, RenderPriority.RESPONSIVE)
    } else {
      // in case of some weird window changes, fault is fixed asynchronously and is not permanent
      renderManager.getClientRectOf(this.mapId, RenderPriority.NORMAL).then(rect => this.cachedMapClientRect = rect)
    }
    return this.cachedMapClientRect
  }

  private async getMapRatioAdjusterClientRect(): Promise<ClientRect> {
    if (!this.cachedMapRatioAdjusterClientRect) {
      this.cachedMapRatioAdjusterClientRect = await renderManager.getClientRectOf(this.mapRatioAdjusterId, RenderPriority.RESPONSIVE)
    } else {
      // in case of some weird window changes, fault is fixed asynchronously and is not permanent
      renderManager.getClientRectOf(this.mapRatioAdjusterId, RenderPriority.NORMAL).then(rect => this.cachedMapRatioAdjusterClientRect = rect)
    }
    return this.cachedMapRatioAdjusterClientRect
  }

  public async flyTo(path: string): Promise<void> {
    const transitionDurationInMS = 500
    const zoomedInPath: Box[] = await this.rootFolder.getZoomedInPath(await this.getInnerMapClientRect())
    const renderedTargetPath: Box[] = this.rootFolder.getRenderedBoxesInPath(path)
    const zoomedTo: Box = zoomedInPath[zoomedInPath.length-1]
    const renderedTarget: Box = renderedTargetPath[renderedTargetPath.length-1]

    let zoomingOut: Promise<void> = Promise.resolve()
    let latestZoomTo: {box: Box, promise: Promise<void>} | 'did not zoom' = 'did not zoom'
    if (!(await renderedTarget.getClientRect()).isInsideOrEqual(await this.getMapClientRect())) {
      zoomingOut = this.zoomToFitBoxes([zoomedTo, renderedTarget], {transitionDurationInMS})
      latestZoomTo = {box: Box.getCommonAncestorOfPaths(zoomedInPath, renderedTargetPath), promise: zoomingOut}
      zoomingOut = util.wait(transitionDurationInMS*0.9) // looks more fluent to not stop while flying to await until everything is rendered
    }

    const renderTargetReport: {boxWatcher?: BoxWatcher, warnings?: string[]} = await this.getBoxBySourcePathAndRenderIfNecessary(path, {foreachBoxInPath: async (box: Box) => {
      await zoomingOut
      if (!zoomedInPath.includes(box)) {
        latestZoomTo = {box, promise: box.site.zoomToFit({transitionDurationInMS})}
      }
    }})
    if (renderTargetReport.warnings) {
      log.warning(`Map::flyTo(path: '${path}') ${renderTargetReport.warnings}`)
    }
    if (!renderTargetReport.boxWatcher) {
      log.warning(`Map::flyTo(path: '${path}') failed to getBoxBySourcePathAndRenderIfNecessary`)
      return
    }
    const targetBox: Box = await renderTargetReport.boxWatcher.get()

    await zoomingOut
    if (latestZoomTo === 'did not zoom' || targetBox !== latestZoomTo.box) {
      latestZoomTo = {box: targetBox, promise: targetBox.site.zoomToFit({animationIfAlreadyFitting: true, transitionDurationInMS})}
    }
    await latestZoomTo.promise
    await this.zoom(0, 0, 0) // TODO otherwise lots of "has path with no rendered boxes. This only happens when mapData is corrupted or LinkEnd::getRenderedPath() is called when it shouldn't." warnings, fix and remove this line
    await renderTargetReport.boxWatcher!.unwatch()
  }

  private async getInnerMapClientRect(): Promise<ClientRect> {
    const mapRect: ClientRect = await this.getMapClientRect()
    const paddingX: number = mapRect.width/2.5
    const paddingY: number = mapRect.height/2.5
    return new ClientRect(mapRect.x+paddingX, mapRect.y+paddingY, mapRect.width-paddingX*2, mapRect.height-paddingY*2)
  }

  public async zoomToFitBoxes(boxes: Box[], options?: {transitionDurationInMS?: number}): Promise<void> {
    if (boxes.length < 1) {
      log.warning('boxes are empty')
      return
    }
    const rectsToFit: LocalRect[] = boxes.map(box => this.rootFolder.transform.innerRectRecursiveToLocal(box, new LocalRect(0, 0, 100, 100)))
    return this.rootFolder.site.zoomToFitRect(LocalRect.createEnclosing(rectsToFit), options)
  }

  private async zoom(delta: number, clientX: number, clientY: number): Promise<void> {
    const deltaNormalized: number = delta*settings.getZoomSpeed() / 1500
    const scaleFactor: number = delta > 0
      ? 1+deltaNormalized
      : 1 / (1-deltaNormalized)

    const mapRatioAdjusterClientRect = await this.getMapRatioAdjusterClientRect()
    const cursorLocalPosition: LocalPosition = new LocalPosition(
      100 * (clientX-mapRatioAdjusterClientRect.x) / mapRatioAdjusterClientRect.width,
      100 * (clientY-mapRatioAdjusterClientRect.y) / mapRatioAdjusterClientRect.height
    )

    await this.rootFolder.site.zoomInParentCoords(scaleFactor, cursorLocalPosition)
    util.logDebug(`zooming ${delta} finished at x=${clientX} and y=${clientY}`)

    if (settings.getBoolean('developerMode')) {
      this.updateDevStats()
    }
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
    if (this.moveState.prevented) {
      mouseDownDragManager.cancelDrag(this.mapId)
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
      mouseDownDragManager.cancelDrag(this.mapId)
      this.updateMouseEventBlockerAndHintToPreventMoving()
      return
    }

    const marginTopOffsetPx: number = position.y - this.moveState.latestMousePosition.y
    const marginLeftOffsetPx: number = position.x - this.moveState.latestMousePosition.x
    const mapRatioAdjusterClientRect = await this.getMapRatioAdjusterClientRect()

    const marginTopOffsetPercent: number = marginTopOffsetPx / (mapRatioAdjusterClientRect.height/100)
    const marginLeftOffsetPercent: number = marginLeftOffsetPx / (mapRatioAdjusterClientRect.width/100)

    this.moveState.latestMousePosition = position

    await this.rootFolder.site.shift(marginLeftOffsetPercent, marginTopOffsetPercent)

    if (settings.getBoolean('developerMode')) {
      this.updateDevStats()
    }
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

  private async updateDevStats(): Promise<void> {
    const devStatsId: string = this.id+'devStats'

    if (!this.devStats) {
      this.devStats = {
        type: 'div',
        id: devStatsId, 
        style: {position: 'absolute', top: '95px', left: '10px'}
      }
      await renderManager.addElementTo(this.id, this.devStats)
    }

    const stats = await this.rootFolder.site.getDetachmentsInRenderedPath()

    const zoomXs: number[] = stats.map(detachment => detachment.zoomX)
    let zoomXText: string = `zoomX = *${zoomXs.join('*')}`
    if (zoomXs.length > 1) {
      zoomXText += ` = ${zoomXs.reduce((product, value) => product*value)}`
    }

    const zoomYs: number[] = stats.map(detachment => detachment.zoomY)
    let zoomYText: string = `zoomY = *${zoomYs.join('*')}`
    if (zoomYs.length > 1) {
      zoomYText += ` = ${zoomYs.reduce((product, value) => product*value)}` 
    }

    const renderedSitesInPath = await this.rootFolder.getZoomedInPath()
    const renderedClientRectsInPath: ClientRect[] = await Promise.all(renderedSitesInPath.map(box => box.getClientRect()))

    await renderManager.setElementsTo(devStatsId, [
      {type: 'div', children: `shiftX = ${stats.map(detachment => detachment.shiftX)}%`},
      {type: 'div', children: `shiftY = ${stats.map(detachment => detachment.shiftY)}%`},
      {type: 'div', children: zoomXText},
      {type: 'div', children: zoomYText},
      {type: 'div', children: `clientXs = ${renderedClientRectsInPath.map(rect => Math.round(rect.x)).join(', ')}`},
      {type: 'div', children: `clientWidths = ${renderedClientRectsInPath.map(rect => Math.round(rect.width)).join(', ')}`}
    ])
  }

}
