import { util } from '../util/util'
import { fileSystem } from '../fileSystemAdapter'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import { boxManager } from './BoxManager'
import { BoxData } from '../mapData/BoxData'
import { LocalRect } from '../LocalRect'
import { ClientRect } from '../ClientRect'
import { FolderBox } from './FolderBox'
import { BoxHeader } from './header/BoxHeader'
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
import { Link } from '../link/Link'
import { log } from '../logService'
import { Style } from '../util/RenderElement'
import { BoxContext } from './BoxContext'
import { BoxTabs } from './tabs/BoxTabs'
import { environment } from '../environmentAdapter'
import { BoxSidebar } from './BoxSidebar'
import { settings } from '../settings/settings'
import { TextInputPopup } from '../TextInputPopup'
import { ToggleSidebarWidget } from '../ToggleSidebarWidget'

export abstract class Box extends AbstractNodeWidget implements DropTarget, Hoverable {
  public static readonly Tabs: typeof BoxTabs = BoxTabs
  public static readonly Sidebar: typeof BoxSidebar = BoxSidebar
  private name: string
  private parent: FolderBox|null
  private mapData: BoxData
  private mapDataFileExists: boolean
  public readonly context: BoxContext
  public readonly transform: Transform
  public readonly site: SizeAndPosition
  public readonly header: BoxHeader
  private readonly tabs: BoxTabs
  private sidebar: BoxSidebar|undefined
  // TODO: move nodes into BoxBody? then header is rendered in front of nodes
  public readonly nodes: BoxNodesWidget // TODO: introduce (Abstract)NodesWidget|SubNodesWidget|ChildNodesWidget that contains all sorts of childNodes (Boxes and LinkNodes)?
  // TODO: move links into BoxBody? then header is rendered in front of links
  public readonly links: BoxLinks // TODO: rename to managedLinks?
  public readonly borderingLinks: BorderingLinks
  private renderState: RenderState = new RenderState()
  private renderScheduler: SkipToNewestScheduler = new SkipToNewestScheduler()
  private watchers: BoxWatcher[] = []
  private unsavedChanges: boolean = false
  private focusState: { // TODO: move sidebar in here or introduce BoxFocusManager|BoxHoverManager
    toggleSidebarButton: ToggleSidebarWidget
    onBoxSidebarSettingChange: (newValue: boolean) => Promise<void>
  } | undefined

  public constructor(name: string, parent: FolderBox|null, mapData: BoxData, mapDataFileExists: boolean, context?: BoxContext) {
    super()
    this.name = name
    this.parent = parent
    this.mapData = mapData
    this.mapDataFileExists = mapDataFileExists
    if (context) {
      this.context = context
    } else if (parent) {
      this.context = parent.context
    } else {
      util.logError('Box::constructor neither parent nor context are specified, for a RootFolder context has to be specified.')
    }
    this.transform = new Transform(this)
    this.site = new SizeAndPosition(this, this.mapData)
    this.header = this.createHeader()
    this.tabs = new BoxTabs(this)
    this.nodes = new BoxNodesWidget(this)
    this.links = new BoxLinks(this)
    this.borderingLinks = new BorderingLinks(this)

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

  public getParent(): FolderBox|never {
    if (this.parent == null) {
      util.logError('Box.getParent() cannot be called on root.')
    }
    return this.parent
  }

  public abstract isFolder(): boolean

  public abstract isFile(): boolean

  public abstract isSourceless(): boolean

  // TODO: belongs more into map, move?
  public async getZoomedInPath(clientRect?: ClientRect): Promise<Box[]> {
    const zoomedInChild: Box|undefined = await this.getZoomedInChild(clientRect)
    if (!zoomedInChild) {
        return [this]
    }
    return [this, ...await zoomedInChild.getZoomedInPath(clientRect)]
  }

  public async getZoomedInChild(clientRect?: ClientRect): Promise<Box | undefined> {
    if (!clientRect) {
      clientRect = await this.context.getMapClientRect()
    }
    let renderedChildBoxes: Box[] = []
    for (const child of this.getChilds()) { // filter does not support promises
      if (child instanceof Box && child.isBodyBeingRendered()) {
        if ((await child.getClientRect()).isPositionInside(clientRect.getMidPosition())) {
          renderedChildBoxes.push(child)
        }
      }
    }

    if (renderedChildBoxes.length < 1) {
      return undefined
    }
    
    if (renderedChildBoxes.length !== 1) {
      let message: string = `Box::getZoomedInChild(..) Expected exactly 1 zoomed in child`
      message += `, but are ${renderedChildBoxes.length} (${renderedChildBoxes.map(box => box.getName())}).`
      log.warning(message)
    }
    return renderedChildBoxes[0]
  }

  // TODO: introduce NodeWatcher or Watcher<AbsctractNodeWidget> and join node & watcher, but then node needs to be watched, not the parent of node?
  public async findChildByIdAndRenderIfNecessary(id: string): Promise<{node: Box|NodeWidget, watcher: BoxWatcher}|undefined>  {
    const watcher: BoxWatcher = await BoxWatcher.newAndWatch(this)
    const node: Box|NodeWidget|undefined = this.findChildById(id)
    if (!node) {
      watcher.unwatch()
      return undefined
    }
    return {node, watcher}
  }

  public findChildById(id: string): Box|NodeWidget|undefined { // TODO: change return type to AbstractNodeWidget as soon as available
    return this.getChilds().find(child => child.getId() === id)
  }

  public getChilds(): (Box|NodeWidget)[] { // TODO: change return type to AbstractNodeWidget as soon as available
    return this.nodes.getNodes()
  }

  // TODO: introduce NodeWatcher or Watcher<AbsctractNodeWidget> and join node & watcher, but then node needs to be watched, not the parent of node?
  public async getDescendantByPathAndRenderIfNecessary(path: {id: string}[]): Promise<{node: Box|NodeWidget, watcher: BoxWatcher}> {
    if (path.length < 1) {
      log.warning(`Box::getDescendantByPathAndRenderIfNecessary(..) path is empty, defaulting to this.`)
      return {node: this, watcher: await BoxWatcher.newAndWatch(this)}
    }
    const child: {node: Box|NodeWidget, watcher: BoxWatcher} | undefined = await this.findChildByIdAndRenderIfNecessary(path[0].id)
    if (!child) {
      log.warning(`Box::getDescendantByPathAndRenderIfNecessary(..) failed to find child with id '${path[0].id}' defaulting to this.`)
      return {node: this, watcher: await BoxWatcher.newAndWatch(this)}
    }
    if (path.length === 1) {
      return child
    }
    if (!(child.node instanceof Box)) {
      log.warning(`Box::getDescendantByPathAndRenderIfNecessary(..) child.node is not instanceof Box although it is not the last element in path.`)
      return child
    }
    const descendant: {node: Box|NodeWidget, watcher: BoxWatcher} = await child.node.getDescendantByPathAndRenderIfNecessary(path.slice(1))
    child.watcher.unwatch()
    return descendant
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
    
    const borderingLinksToReorder: Link[] = this.borderingLinks.getAll()
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
    await Promise.all(borderingLinksToReorder.map(link => link.reorderAndSaveAndRender({movedWayPoint: this})))
  }

  // TODO: extract this into another class?
  public async openRenamePopupAndAwaitResolve(): Promise<void> {
    const newName: string|undefined = await TextInputPopup.buildAndRenderAndAwaitResolve(`Rename Box '${this.getName()}'`, this.getName())
    if (newName) {
      await this.rename(newName)
    }
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
      util.logInfo(`moved '${oldSrcPath}' to '${newSrcPath}'`)
    }
    if (this.isMapDataFileExisting()) {
      await fileSystem.rename(oldMapDataFilePath, newMapDataFilePath)
      util.logInfo(`moved '${oldMapDataFilePath}' to '${newMapDataFilePath}'`)
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
      await box.getParent().body.render()
      if (box.isBeingRendered()) {
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
      pros.push(renderManager.addEventListenerTo(this.getId(), 'dblclick', () => this.site.zoomToFit({animationIfAlreadyFitting: true})))
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
    
    if (this.hasWatchers()) {
      if (!force) {
        this.renderState.setUnrenderFinishedStillRendered()
        return
      }
      log.warning('Box::unrenderIfPossible(force=true) unrendering box that has watchers, this can happen when folder gets closed while plugins are busy or plugins don\'t clean up.')
    }
    if ((await this.unrenderBodyIfPossible(force)).rendered) {
      this.renderState.setUnrenderFinishedStillRendered()
      return
    }

    await Promise.all([
      relocationDragManager.removeDropTarget(this),
      HoverManager.removeHoverable(this, false),
      this.removeFocusElements({priority: RenderPriority.NORMAL, awaitAnimations: false}),
      this.detachGrid(),
      this.header.unrender(),
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
    if (this.focusState) {
      log.warning(`Box::onHoverOver() called although box '${this.getName()}' is already focused.`)
    }

    await Promise.all([
      this.addFocusElements({priority: RenderPriority.RESPONSIVE, awaitAnimations: true}),
      this.borderingLinks.setHighlightAllThatShouldBeRendered(true)
    ])
  }

  private async onHoverOut(): Promise<void> {
    // TODO: move scaleTool.isScalingInProgress() into HoverManager
    if (scaleTool.isScalingInProgress()) {
      return
    }
    if (!this.focusState) {
      log.warning(`Box::onHoverOut() called although box '${this.getName()}' is not focused.`)
    }

    await Promise.all([
      this.removeFocusElements({priority: RenderPriority.RESPONSIVE, awaitAnimations: true}),
      this.borderingLinks.setHighlightAllThatShouldBeRendered(false)
    ])
  }

  private async addFocusElements(options: {priority: RenderPriority, awaitAnimations: boolean}): Promise<void> {
    if (this.focusState) {
      return
    }
    this.focusState = {
      toggleSidebarButton: new ToggleSidebarWidget(this.getId()+'-toggleSidebarButton', 'boxSidebar'),
      onBoxSidebarSettingChange: async (newValue: boolean) => {
        if (!this.focusState) {
          log.warning(`Box::addFocusElements()::onBoxSidebarSettingChange() called although not focused.`)
          return
        }
        if (newValue) {
          await this.addSidebar(RenderPriority.RESPONSIVE)
        } else {
          await this.removeSidebar({priority: RenderPriority.RESPONSIVE, awaitSlideAnimation: true})
        }
      }
    }
    settings.subscribeBoolean('boxSidebar', this.focusState.onBoxSidebarSettingChange)
    await Promise.all([
      scaleTool.renderInto(this),
      this.tabs.renderBar(),
      this.addOpenButtonIfFile(options.priority),
      renderManager.addElementTo(this.getId(), this.focusState.toggleSidebarButton.shape({position: 'absolute', top: '28px', right: '4px'}), options.priority),
      this.addSidebar(options.priority)
    ])
  }

  private async removeFocusElements(options: {priority: RenderPriority, awaitAnimations: boolean}): Promise<void> {
    if (!this.focusState) {
      return
    }
    const toggleSidebarButton = this.focusState.toggleSidebarButton

    settings.unsubscribeBoolean('boxSidebar', this.focusState.onBoxSidebarSettingChange)
    toggleSidebarButton.onUnmount()

    this.focusState = undefined
    await Promise.all([
      scaleTool.unrenderFrom(this),
      this.tabs.unrenderBar(),
      this.removeOpenButtonIfFile(options.priority),
      renderManager.remove(toggleSidebarButton.id, options.priority),
      this.removeSidebar({priority: options.priority, awaitSlideAnimation: options.awaitAnimations})
    ])
  }

  private async addOpenButtonIfFile(priority: RenderPriority): Promise<void> {
    if (!this.isFile()) {
      return
    }
    return renderManager.addElementTo(this.getId(), {
      type: 'button',
      id: this.getId()+'-openButton',
      style: {position: 'absolute', top: '4px', right: '4px', cursor: 'pointer'},
      onclick: () => environment.openFile(this.getSrcPath()),
      children: 'Open'
    }, priority)
  }

  private async removeOpenButtonIfFile(priority: RenderPriority): Promise<void> {
    if (!this.isFile()) {
      return
    }
    return renderManager.remove(this.getId()+'-openButton', priority)
  }

  private async addSidebar(priority: RenderPriority): Promise<void> {
    if (!settings.getBoolean('boxSidebar')) {
      return
    }
    if (this.sidebar) {
      log.warning('Box::addSidebar() called although sidebar is already set.')
      return
    }

    this.sidebar = new BoxSidebar(this)
    this.sidebar.mounted = true
    await renderManager.addElementTo(this.getId(), this.sidebar.shape({
      position: 'absolute',
      zIndex: '1',
      left: '100%',
      width: 'max-content',
      height: '100%'
    }), priority)
    await util.wait(50) // TODO: otherwise slideAnimation would not always work, renderManager.addElementTo(..) seems to return too early, fix this (maybe by using styleClass)

    if (this.sidebar && this.sidebar.mounted) {
      await this.sidebar.render({priority, awaitSlideAnimation: true})
    }
  }

  private async removeSidebar(options: {priority: RenderPriority, awaitSlideAnimation: boolean}): Promise<void> {
    if (!this.sidebar) {
      return
    }

    const sidebar: BoxSidebar = this.sidebar
    this.sidebar = undefined
    await sidebar.unrender(options)

    if (sidebar.mounted) {
      sidebar.mounted = false
      await renderManager.remove(sidebar.getId(), options.priority)
    }
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

  public getMapData(): BoxData {
    return this.mapData
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
    if (!this.context.projectSettings.isDataFileExisting()) {
      await this.context.projectSettings.saveToFileSystem()
    }

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

  public async renderStyleWithRerender(options?: {
    renderStylePriority?: RenderPriority,
    transitionDurationInMS?: number
  }): Promise<{transitionAndRerender: Promise<void>} > {
    await this.renderStyle(options?.renderStylePriority, options?.transitionDurationInMS)
    const rendered: Promise<void> = this.render()
    if (!options?.transitionDurationInMS) {
      return {transitionAndRerender: rendered}
    }

    const transitionDurationInMS: number = options.transitionDurationInMS
    const transitionAndRerender: Promise<void> = new Promise<void>(async resolve => {
      const timelimit: number = Date.now() + transitionDurationInMS
      await rendered
      while (timelimit > Date.now()) {
        await util.wait(Math.min(20, timelimit-Date.now()))
        if (timelimit <= Date.now()) {
          break
        }
        await this.render()
      }
      await this.render() // rerender at least once after transition finished, to be sure that childs get rendered if they should
      resolve()
    })
    return {transitionAndRerender}
  }

  public async renderStyle(priority: RenderPriority = RenderPriority.NORMAL, transitionDurationInMS?: number): Promise<void> {
    const rect: LocalRect = this.getLocalRect()

    const basicStyle: string = 'display:inline-block;position:absolute;overflow:visible;'
    const scaleStyle: string = 'width:'+rect.width+'%;height:'+rect.height+'%;'
    const positionStyle: string = 'left:'+rect.x+'%;top:'+rect.y+'%;'
    const transitionStyle: string = transitionDurationInMS ? `transition:${transitionDurationInMS}ms;` : ''

    await renderManager.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle + transitionStyle, priority)
  }

  public async updateMeasuresAndBorderingLinks(
    measuresInPercentIfChanged: {x?: number, y?: number, width?: number, height?: number},
    priority: RenderPriority = RenderPriority.NORMAL
  ): Promise<void> {
    await this.site.updateMeasures(measuresInPercentIfChanged, priority)
    await this.borderingLinks.renderAll()
  }

  public async hideContentIfRendered(): Promise<void> {
    return this.addStyleToContentIfRendered({display: 'none'})
  }

  public async showContentIfRendered(): Promise<void> {
    return this.addStyleToContentIfRendered({display: null})
  }
  
  private async addStyleToContentIfRendered(style: Style): Promise<void> {
    if (!this.isRendered()) {
      log.warning(`'${this.getName()}': Box::addStyleOfContentIfRendered(${util.stringify(style)}) box is not rendered, no effect.`)
      return
    }
    await Promise.all([
      renderManager.addStyleTo(this.getBodyId(), style),
      renderManager.addStyleTo(this.nodes.getId(), style),
      renderManager.addStyleTo(this.links.getId(), style)
    ])
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

  public isDescendantOf(ancestor: Box): boolean {
    for (let descendant: Box = this; !descendant.isRoot(); descendant = descendant.getParent()) {
      if (descendant.getParent() === ancestor) {
        return true
      }
    }
    return false
  }

  public isAncestorOf(descendant: AbstractNodeWidget): boolean {
    for (; !descendant.isRoot(); descendant = descendant.getParent()) {
      if (this === descendant.getParent()) {
        return true
      }
    }
    return false
  }

  public static findCommonAncestor(fromBox: Box|NodeWidget, toBox: Box|NodeWidget): {
    commonAncestor: Box, 
    fromPath: (Box|NodeWidget)[], 
    toPath: (Box|NodeWidget)[]
  } | never {
    const fromPath: (Box|NodeWidget)[] = [fromBox]
    const toPath: (Box|NodeWidget)[] = [toBox]

    let commonAncestorCandidate: Box = fromBox instanceof Box // TODO: in future it will also make sense that commonAncestor is a general node
      ? fromBox
      : fromBox.getParent()

    while (fromPath[0] !== toPath[0]) {
      if (fromPath[0].isRoot() && toPath[0].isRoot()) {
        util.logError(fromBox.getSrcPath()+' and '+toBox.getSrcPath()+' do not have a common ancestor, file structure seems to be corrupted.')
      }

      if (!fromPath[0].isRoot()) {
        commonAncestorCandidate = fromPath[0].getParent()
        if (toPath.includes(commonAncestorCandidate)) {
          toPath.splice(0, Math.min(toPath.indexOf(commonAncestorCandidate)+1, toPath.length-1))
          break
        } else {
          fromPath.unshift(commonAncestorCandidate)
        }
      }

      if (!toPath[0].isRoot()) {
        commonAncestorCandidate = toPath[0].getParent()
        if (fromPath.includes(commonAncestorCandidate)) {
          fromPath.splice(0, Math.min(fromPath.indexOf(commonAncestorCandidate)+1, fromPath.length-1))
          break
        } else {
          toPath.unshift(commonAncestorCandidate)
        }
      }
    }

    return {commonAncestor: commonAncestorCandidate, fromPath, toPath}
  }

  public static getCommonAncestorOfPaths(path: Box[], otherPath: Box[]): Box {
    if (!path[0] || path[0] !== otherPath[0]) {
      log.warning(`Box::getCommonAncestor(path: '${path.map(box => box.getName())}', otherPath: '${otherPath.map(box => box.getName())}') expected paths to start with same object.`)
    }
    let commonAncestor: Box = path[0]
    for (let i = 0; i < path.length && i < otherPath.length; i++) {
      if (path[i] === otherPath[i]) {
        commonAncestor = path[i]
      } else {
        break
      }
    }
    return commonAncestor
  }

}
