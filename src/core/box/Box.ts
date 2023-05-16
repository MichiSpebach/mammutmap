import { util } from '../util/util'
import { fileSystem } from '../fileSystemAdapter'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import { boxManager } from './BoxManager'
import { BoxData } from '../mapData/BoxData'
import { LocalRect } from '../LocalRect'
import { ClientRect } from '../ClientRect'
import { FolderBox } from './FolderBox'
import { BoxHeader } from './BoxHeader'
import { scaleTool } from './ScaleTool'
import { BoxLinks } from './BoxLinks'
import { LinkData } from '../mapData/LinkData'
import { DropTarget } from '../DropTarget'
import { relocationDragManager } from '../RelocationDragManager'
import { Hoverable } from '../Hoverable'
import { HoverManager } from '../HoverManager'
import { BoxWatcher } from './BoxWatcher'
import { Transform } from './Transform'
import { grid } from './Grid'
import { BoxNodesWidget } from './BoxNodesWidget'
import { NodeData } from '../mapData/NodeData'
import { BorderingLinks } from '../link/BorderingLinks'
import { ProjectSettings } from '../ProjectSettings'
import { RenderState } from '../util/RenderState'
import { SkipToNewestScheduler } from '../util/SkipToNewestScheduler'
import { SizeAndPosition } from './SizeAndPosition'
import { NodeWidget } from '../node/NodeWidget'
import { AbstractNodeWidget } from '../AbstractNodeWidget'

export abstract class Box extends AbstractNodeWidget implements DropTarget, Hoverable {
  private name: string
  private parent: FolderBox|null
  private mapData: BoxData
  private mapDataFileExists: boolean
  public readonly transform: Transform
  public readonly site: SizeAndPosition
  private readonly header: BoxHeader
  // TODO: move nodes into BoxBody
  public readonly nodes: BoxNodesWidget // TODO: introduce (Abstract)NodesWidget|SubNodesWidget|ChildNodesWidget that contains all sorts of childNodes (Boxes and LinkNodes)?
  // TODO: move links into BoxBody?
  public readonly links: BoxLinks // TODO: rename to managedLinks?
  public readonly borderingLinks: BorderingLinks
  private renderState: RenderState = new RenderState()
  private renderScheduler: SkipToNewestScheduler = new SkipToNewestScheduler()
  private watchers: BoxWatcher[] = []
  private unsavedChanges: boolean = false

  public constructor(name: string, parent: FolderBox|null, mapData: BoxData, mapDataFileExists: boolean) {
    super()
    this.name = name
    this.parent = parent
    this.mapData = mapData
    this.mapDataFileExists = mapDataFileExists
    this.transform = new Transform(this)
    this.site = new SizeAndPosition(this, this.mapData)
    this.header = this.createHeader()
    this.nodes = new BoxNodesWidget(this)
    this.links = new BoxLinks(this)
    this.borderingLinks = new BorderingLinks(this, this.getParentBorderingLinks().getLinksThatIncludeWayPointFor(this))

    boxManager.addBox(this)
  }

  public async destruct(): Promise<void> {
    if (this.isRendered()) {
      util.logWarning('destruct called on rendered box '+this.getSrcPath()+', box should be unrendered before')
      await this.unrenderIfPossible(true)
    }
    boxManager.removeBox(this)
  }

  protected abstract createHeader(): BoxHeader // TODO: make this somehow a constructor argument for subclasses

  public getId(): string {
    return this.mapData.id
  }

  private getGridPlaceHolderId(): string {
    return this.getId()+'Grid'
  }

  private getBorderId(): string {
    return this.getId()+'Border'
  }

  public getScaleToolPlaceHolderId(): string {
    return this.getId()+'ScaleToolPlaceHolder'
  }

  public getName(): string {
    return this.name
  }

  public getSrcPath(): string {
    return util.concatPaths(this.getParent().getSrcPath(), this.getName())
  }

  public getMapPath(): string {
    return util.concatPaths(this.getParent().getMapPath(), this.getName())
  }

  public getMapDataFilePath(): string {
    return this.getMapPath()+'.json'
  }

  public getProjectSettings(): ProjectSettings {
    return this.getParent().getProjectSettings()
  }

  public getParentBorderingLinks(): BorderingLinks {
    if (!this.parent) {
      return new BorderingLinks(this, []) // TODO: override/implement this in RootFolderBox, don't give in 'this' (maybe implement BorderingLinks.buildEmpty())
    }
    return this.parent.borderingLinks
  }

  public getParent(): FolderBox|never {
    if (this.parent == null) {
      util.logError('Box.getParent() cannot be called on root.')
    }
    return this.parent
  }

  public abstract isFolder(): boolean

  public abstract isFile(): boolean

  public abstract isSourceless(): boolean

  public getChilds(): (Box|NodeWidget)[] { // TODO: change return type to AbstractNodeWidget as soon as available
    return this.nodes.getNodes()
  }

  public isRendered(): boolean {
    return this.renderState.isRendered()
  }

  public isBeingRendered(): boolean {
    return this.renderState.isBeingRendered()
  }

  public async setParentAndFlawlesslyResizeAndSave(newParent: FolderBox): Promise<void> {
    if (this.site.isDetached()) {
      util.logWarning(`Box::setParentAndFlawlesslyResizeAndSave(..) called on detached box "${this.getName()}".`)
    }
    if (this.parent == null) {
      util.logError('Box.setParent() cannot be called on root.')
    }
    const parentClientRect: ClientRect = await this.parent.getClientRect()
    const newParentClientRect: ClientRect = await newParent.getClientRect()

    this.parent.removeBox(this)
    await newParent.addBox(this)

    const oldSrcPath: string = this.getSrcPath()
    const oldMapDataFilePath: string = this.getMapDataFilePath()
    this.parent = newParent
    const newSrcPath: string = this.getSrcPath()
    const newMapDataFilePath: string = this.getMapDataFilePath()

    const distanceBetweenParentsX: number = (parentClientRect.x - newParentClientRect.x) / newParentClientRect.width * 100
    const distanceBetweenParentsY: number = (parentClientRect.y - newParentClientRect.y) / newParentClientRect.height * 100
    const scaleX: number = parentClientRect.width / newParentClientRect.width
    const scaleY: number = parentClientRect.height / newParentClientRect.height

    const newX: number = distanceBetweenParentsX + this.mapData.x * scaleX
    const newY: number = distanceBetweenParentsY + this.mapData.y * scaleY
    const newWidth: number = this.mapData.width * scaleX
    const newHeight: number = this.mapData.height * scaleY
    await this.site.updateMeasures({x: newX, y: newY, width: newWidth, height: newHeight})

    await this.renameAndMoveOnFileSystem(oldSrcPath, newSrcPath, oldMapDataFilePath, newMapDataFilePath)
    await this.saveMapData()
    await this.borderingLinks.reorderAndSaveAll()
  }

  public async rename(newName: string): Promise<void> {
    const oldSrcPath: string = this.getSrcPath()
    const oldMapDataFilePath: string = this.getMapDataFilePath()
    this.name = newName
    const newSrcPath: string = this.getSrcPath()
    const newMapDataFilePath: string = this.getMapDataFilePath()
    await this.renameAndMoveOnFileSystem(oldSrcPath, newSrcPath, oldMapDataFilePath, newMapDataFilePath)
    await this.header.render()
  }

  protected async renameAndMoveOnFileSystem(
    oldSrcPath: string, newSrcPath: string,
    oldMapDataFilePath: string, newMapDataFilePath: string
  ): Promise<void> {
    if (!this.isSourceless()) {
      await fileSystem.rename(oldSrcPath, newSrcPath)
      util.logInfo('moved ' + oldSrcPath + ' to ' + newSrcPath)
    }
    if (this.isMapDataFileExisting()) {
      await fileSystem.rename(oldMapDataFilePath, newMapDataFilePath)
      util.logInfo('moved ' + oldMapDataFilePath + ' to ' + newMapDataFilePath)
    }
  }

  public async getParentClientRect(): Promise<ClientRect> { // TODO: rename, add suffix 'ToRender'?
    return this.getParent().getClientRect()
  }

  public async getClientShape(): Promise<ClientRect> { // TODO: rename, add suffix 'ToRender'?
    return this.getClientRect()
  }
  public async getClientRect(): Promise<ClientRect> { // TODO: rename, add suffix 'ToRender'? // TODO: delegate into site?
    return this.getParent().transform.localToClientRect(this.getLocalRect())
  }

  public getLocalRect(): LocalRect { // TODO: rename to getLocalRectToRender|getRenderLocalRect?
    return this.site.getLocalRectToRender()
  }

  public getLocalRectToSave(): LocalRect {
    return this.mapData.getRect()
  }

  public async addWatcherAndUpdateRender(watcher: BoxWatcher): Promise<void> {
    this.watchers.push(watcher)
    await this.render()
  }

  public async removeWatcherAndUpdateRender(watcher: BoxWatcher): Promise<void> {
    this.removeWatcher(watcher)

    for (let box: Box = this; !box.isRoot(); box = box.getParent()) {
      await box.render()
      if (box.isBodyRendered()) {
        break
      }
    }
  }

  protected removeWatcher(watcher: BoxWatcher): void {
    this.watchers.splice(this.watchers.indexOf(watcher), 1)
  }

  public hasWatchers(): boolean {
    return this.watchers.length !== 0
  }

  public async render(): Promise<void> { await this.renderScheduler.schedule(async () => {
    this.renderState.setRenderStarted()
    const pros: Promise<void>[] = []

    if (!this.renderState.isRendered()) {
      this.renderStyle()

      const styleAbsoluteAndStretched: string = 'position:absolute;width:100%;height:100%;'
      // TODO: introduce <div id="content"> that contains everything but border and scaleToolPlaceholder? would make sense for detaching mechanism to leave borderFrame at savedPosition
      const backgroundHtml = `<div style="${styleAbsoluteAndStretched}z-index:-1;" class="${this.getBackgroundStyleClass()}"></div>`
      const gridPlaceHolderHtml = `<div id="${this.getGridPlaceHolderId()}" style="${styleAbsoluteAndStretched}"></div>`
      const bodyHtml = `<div id="${this.getBodyId()}" style="${styleAbsoluteAndStretched}overflow:${this.getBodyOverflowStyle()};"></div>`
      const headerHtml = `<div id="${this.header.getId()}" style="position:absolute;overflow:hidden;width:100%;max-height:100%;"></div>`
      const borderHtml = `<div id="${this.getBorderId()}" class="${style.getBoxBorderClass()} ${style.getAdditionalBoxBorderClass(this.mapDataFileExists)}"></div>`
      const scaleToolPlaceholderHtml = `<div id="${this.getScaleToolPlaceHolderId()}"></div>`
      const nodesHtml = `<div id="${this.nodes.getId()}"></div>`
      const linksHtml = `<div id="${this.links.getId()}"></div>`
      await renderManager.setContentTo(this.getId(), backgroundHtml+gridPlaceHolderHtml+bodyHtml+headerHtml+borderHtml+scaleToolPlaceholderHtml+nodesHtml+linksHtml)

      pros.push(this.header.render())
      pros.push(this.borderingLinks.renderAll())
    }

    pros.push(this.renderBody())

    if (!this.renderState.isRendered()) {
      pros.push(relocationDragManager.addDropTarget(this))
      pros.push(HoverManager.addHoverable(this, () => this.onHoverOver(), () => this.onHoverOut()))
    }

    pros.push(this.renderAdditional())

    await Promise.all(pros)
    this.renderState.setRenderFinished()
  })}

  public async unrenderIfPossible(force?: boolean): Promise<{rendered: boolean}> { await this.renderScheduler.schedule(async () => {
    if (!this.renderState.isRendered()) {
      return
    }
    this.renderState.setUnrenderStarted()
    
    if ((await this.unrenderBodyIfPossible(force)).rendered) {
      this.renderState.setUnrenderFinishedStillRendered()
      return
    }
    if (this.hasWatchers()) {
      if (!force) {
        this.renderState.setUnrenderFinishedStillRendered()
        return
      }
      util.logWarning('unrendering box that has watchers, this can happen when folder gets closed while plugins are busy or plugins don\'t clean up')
    }

    await Promise.all([
      relocationDragManager.removeDropTarget(this),
      HoverManager.removeHoverable(this),
      this.detachGrid(),
      this.header.unrender(),
      scaleTool.unrenderFrom(this),
      this.unrenderAdditional(),
      this.borderingLinks.renderAllThatShouldBe() // otherwise borderingLinks would not float back to border of parent
    ])

    this.renderState.setUnrenderFinished()
    return
    })

    return {rendered: this.renderState.isRendered()}
  }

  private async onHoverOver(): Promise<void> {
    // TODO: move scaleTool.isScalingInProgress() into HoverManager
    if (scaleTool.isScalingInProgress() || this.renderState.isBeingUnrendered()) {
      return
    }

    await Promise.all([
      scaleTool.renderInto(this),
      this.borderingLinks.setHighlightAllThatShouldBeRendered(true)
    ])
  }

  private async onHoverOut(): Promise<void> {
    // TODO: move scaleTool.isScalingInProgress() into HoverManager
    if (scaleTool.isScalingInProgress()) {
      return
    }

    await Promise.all([
      scaleTool.unrenderFrom(this),
      this.borderingLinks.setHighlightAllThatShouldBeRendered(false)
    ])
  }

  public isMapDataFileExisting(): boolean {
    return this.mapDataFileExists
  }

  private async setMapDataFileExistsAndUpdateBorderStyle(exists: boolean): Promise<void> {
    if (this.mapDataFileExists != exists) {
      this.mapDataFileExists = exists
      await renderManager.addClassTo(this.getBorderId(), style.getAdditionalBoxBorderClass(this.mapDataFileExists))
      await renderManager.removeClassFrom(this.getBorderId(), style.getAdditionalBoxBorderClass(!this.mapDataFileExists))
    }
  }

  public getMapNodeData(): NodeData[] {
    return this.mapData.nodes
  }

  public getMapLinkData(): LinkData[] {
    return this.mapData.links
  }

  public async restoreMapData(): Promise<void> {
    const restoredMapData: BoxData|null = await fileSystem.loadFromJsonFile(this.getMapDataFilePath(), (json: string) => BoxData.buildFromJson(json))
    if (restoredMapData === null) {
      util.logWarning('failed to restoreMapData of '+this.getSrcPath()+' because mapDataFile does not exist')
      return
    }

    this.mapData = restoredMapData

    await this.render()
    return await this.renderStyle()
  }

  public async saveMapData(): Promise<void> {
    const mapDataFilePath: string = this.getMapDataFilePath()
    this.mapData.roundFieldsForSave()
    await fileSystem.saveToJsonFile(mapDataFilePath, this.mapData, {throwInsteadOfWarn: true}).then(() => {
      util.logInfo('saved ' + mapDataFilePath)
      this.setMapDataFileExistsAndUpdateBorderStyle(true)
    }).catch(reason => {
      util.logWarning(`Box::saveMapData() failed at mapDataFilePath "${mapDataFilePath}", reason is ${reason}`)
    })
  }

  public async onDragEnter(): Promise<void> {
    await this.attachGrid(RenderPriority.RESPONSIVE)
  }

  public async onDragLeave(): Promise<void> {
    await this.detachGrid(RenderPriority.RESPONSIVE)
  }

  public async attachGrid(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    if (this.renderState.isUnrenderInProgress()) {
      util.logWarning('prevented attaching grid to box that gets unrendered') // TODO: only to check that this gets triggered, remove
      return
    }
    await grid.renderInto(this.getGridPlaceHolderId(), priority)
  }

  public async detachGrid(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    await grid.unrenderFrom(this.getGridPlaceHolderId(), priority)
  }

  public async renderStyle(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    const rect: LocalRect = this.getLocalRect()

    const basicStyle: string = 'display:inline-block;position:absolute;overflow:visible;'
    const scaleStyle: string = 'width:'+rect.width+'%;height:'+rect.height+'%;'
    const positionStyle: string = 'left:'+rect.x+'%;top:'+rect.y+'%;'

    await renderManager.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle, priority)
  }

  public async updateMeasuresAndBorderingLinks(
    measuresInPercentIfChanged: {x?: number, y?: number, width?: number, height?: number},
    priority: RenderPriority = RenderPriority.NORMAL
  ): Promise<void> {
    await this.site.updateMeasures(measuresInPercentIfChanged, priority)
    await this.borderingLinks.renderAll()
  }

  protected abstract getBodyOverflowStyle(): 'auto'|'hidden'|'visible'

  protected abstract getBackgroundStyleClass(): string

  protected abstract renderAdditional(): Promise<void>

  protected abstract unrenderAdditional(): Promise<void>

  protected abstract getBodyId(): string

  protected abstract renderBody(): Promise<void>

  protected abstract unrenderBodyIfPossible(force?: boolean): Promise<{rendered: boolean}>

  public abstract isBodyRendered(): boolean

  public abstract isBodyBeingRendered(): boolean

  public abstract getInnerLinksRecursive(): BoxLinks[]

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

  public static findCommonAncestor(fromBox: Box|NodeWidget, toBox: Box|NodeWidget): {commonAncestor: Box, fromBoxes: (Box|NodeWidget)[], toBoxes: (Box|NodeWidget)[]} | never { // TODO: rename fromBoxes to fromPath and toBoxes to toPath
    const fromBoxes: (Box|NodeWidget)[] = [fromBox]
    const toBoxes: (Box|NodeWidget)[] = [toBox]

    let commonAncestorCandidate: Box = fromBox instanceof Box // TODO: in future it will also make sense that commonAncestor is a general node
      ? fromBox
      : fromBox.getParent()

    while (fromBoxes[0] !== toBoxes[0]) {
      if (fromBoxes[0].isRoot() && toBoxes[0].isRoot()) {
        util.logError(fromBox.getSrcPath()+' and '+toBox.getSrcPath()+' do not have a common ancestor, file structure seems to be corrupted.')
      }

      if (!fromBoxes[0].isRoot()) {
        commonAncestorCandidate = fromBoxes[0].getParent()
        if (toBoxes.includes(commonAncestorCandidate)) {
          toBoxes.splice(0, Math.min(toBoxes.indexOf(commonAncestorCandidate)+1, toBoxes.length-1))
          break
        } else {
          fromBoxes.unshift(commonAncestorCandidate)
        }
      }

      if (!toBoxes[0].isRoot()) {
        commonAncestorCandidate = toBoxes[0].getParent()
        if (fromBoxes.includes(commonAncestorCandidate)) {
          fromBoxes.splice(0, Math.min(fromBoxes.indexOf(commonAncestorCandidate)+1, fromBoxes.length-1))
          break
        } else {
          toBoxes.unshift(commonAncestorCandidate)
        }
      }
    }

    return {commonAncestor: commonAncestorCandidate, fromBoxes: fromBoxes, toBoxes: toBoxes}
  }

}
