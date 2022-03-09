import { util } from '../util'
import { fileSystem } from '../fileSystemAdapter'
import { renderManager, RenderPriority } from '../RenderManager'
import { style } from '../styleAdapter'
import { boxManager } from './BoxManager'
import { BoxMapData } from './BoxMapData'
import { Rect } from '../Rect'
import { FolderBox } from './FolderBox'
import { BoxHeader } from './BoxHeader'
import { BoxBorder } from './BoxBorder'
import { BoxLinks } from './BoxLinks'
import { Link } from './Link'
import { BoxMapLinkData } from './BoxMapLinkData'
import { WayPointData } from './WayPointData'
import { DropTarget } from '../DropTarget'
import { DragManager } from '../DragManager'
import { Hoverable } from '../Hoverable'
import { HoverManager } from '../HoverManager'
import { BoxWatcher } from './BoxWatcher'
import { ClientPosition, LocalPosition, Transform } from './Transform'
import { grid } from './Grid'

export abstract class Box implements DropTarget, Hoverable {
  private name: string
  private parent: FolderBox|null
  private mapData: BoxMapData
  private mapDataFileExists: boolean
  public readonly transform: Transform
  private readonly gridPlaceHolderId: string
  private readonly header: BoxHeader
  private readonly border: BoxBorder
  public readonly links: BoxLinks
  private readonly borderingLinks: Link[] = [] // TODO: move into BoxLinks?
  private rendered: boolean = false
  private watchers: BoxWatcher[] = []
  private unsavedChanges: boolean = false

  public constructor(name: string, parent: FolderBox|null, mapData: BoxMapData, mapDataFileExists: boolean) {
    this.name = name
    this.parent = parent
    this.mapData = mapData
    this.mapDataFileExists = mapDataFileExists
    this.transform = new Transform(this)
    this.gridPlaceHolderId = this.getId()+'Grid'
    this.header = this.createHeader()
    this.border = new BoxBorder(this)
    this.links = new BoxLinks(this)

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

  public getName(): string {
    return this.name
  }

  public getSrcPath(): string {
    return this.getParent().getSrcPath()+'/'+this.getName()
  }

  public getMapPath(): string {
    return this.getParent().getMapPath()+'/'+this.getName()
  }

  public getMapDataFilePath(): string {
    return this.getMapPath()+'.json'
  }

  public getParent(): FolderBox|never {
    if (this.parent == null) {
      util.logError('Box.getParent() cannot be called on root.')
    }
    return this.parent
  }

  public isRoot(): boolean {
    return false
  }

  public abstract isFolder(): boolean

  public abstract isFile(): boolean

  protected isRendered(): boolean {
    return this.rendered
  }

  public async setParentAndFlawlesslyResizeAndSave(newParent: FolderBox): Promise<void> {
    if (this.parent == null) {
      util.logError('Box.setParent() cannot be called on root.')
    }
    const parentClientRect: Rect = await this.parent.getClientRect()
    const newParentClientRect: Rect = await newParent.getClientRect()

    this.parent.removeBox(this)
    newParent.addBox(this)

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
    await this.updateMeasures({x: newX, y: newY, width: newWidth, height: newHeight})

    await fileSystem.rename(oldSrcPath, newSrcPath)
    util.logInfo('moved ' + oldSrcPath + ' to ' + newSrcPath)
    if (this.isMapDataFileExisting()) {
      await fileSystem.rename(oldMapDataFilePath, newMapDataFilePath)
      util.logInfo('moved ' + oldMapDataFilePath + ' to ' + newMapDataFilePath)
    }
    await this.saveMapData()
    await Promise.all(this.borderingLinks.map(link => link.reorderAndSave()))
  }

  public async getClientRect(): Promise<Rect> {
    const topLeftPositionPromise: Promise<ClientPosition> = this.getParent().transform.localToClientPosition(this.mapData.getTopLeftPosition())
    const bottomRightPosition: ClientPosition = await this.getParent().transform.localToClientPosition(this.mapData.getBottomRightPosition())
    const topLeftPosition: ClientPosition = await topLeftPositionPromise
    return new Rect(topLeftPosition.x, topLeftPosition.y, bottomRightPosition.x-topLeftPosition.x, bottomRightPosition.y-topLeftPosition.y)
  }

  // TODO: move into Transform
  public transformLocalToParent(position: LocalPosition): LocalPosition {
    return new LocalPosition(
      this.mapData.x + position.percentX * (this.mapData.width/100),
      this.mapData.y + position.percentY * (this.mapData.height/100)
    )
  }

  public transformInnerCoordsRecursiveToLocal(inner: Box, innerPosition: LocalPosition): LocalPosition {
    let tempBox: Box = inner
    let tempPosition: LocalPosition = innerPosition
    while (tempBox !== this) {
      tempPosition = tempBox.transformLocalToParent(tempPosition)
      tempBox = tempBox.getParent()
    }
    return tempPosition
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

  public async render(): Promise<void> {
    if (!this.isRendered()) {
      this.renderStyle()

      const styleAbsoluteAndStretched: string = 'position:absolute;width:100%;height:100%;'
      const gridPlaceHolderHtml = `<div id="${this.gridPlaceHolderId}" style="${styleAbsoluteAndStretched}"></div>`
      const headerHtml = `<div id="${this.header.getId()}" style="overflow:hidden;max-height:100%"></div>`
      const bodyHtml = `<div id="${this.getBodyId()}"></div>`
      const headerAndBodyHtml = `<div style="${styleAbsoluteAndStretched}overflow:${this.getBodyOverflowStyle()};">${headerHtml+bodyHtml}</div>`
      const borderHtml = `<div id="${this.border.getId()}"></div>`
      const linksHtml = `<div id="${this.links.getId()}"></div>`
      await renderManager.setContentTo(this.getId(), gridPlaceHolderHtml+headerAndBodyHtml+borderHtml+linksHtml)

      await this.header.render()
      await this.border.render()
      this.renderAndRegisterBorderingLinks()
    }

    await this.renderBody()
    if (this.isBodyRendered()) {
      await this.links.render()
    } else {
      await this.links.unrender()
    }

    if (!this.isRendered()) {
      DragManager.addDropTarget(this)
      HoverManager.addHoverable(this, () => this.setHighlight(true), () => this.setHighlight(false))
    }

    await this.renderAdditional()
    this.rendered = true
  }

  public async unrenderIfPossible(force?: boolean): Promise<{rendered: boolean}> {
    if (!this.isRendered()) {
      return {rendered: false}
    }
    if ((await this.unrenderBodyIfPossible(force)).rendered) {
      return {rendered: true}
    }
    if (this.hasWatchers()) {
      if (!force) {
        return {rendered: true}
      }
      util.logWarning('unrendering box that has watchers, this can happen when folder gets closed while plugins are busy or plugins don\'t clean up')
    }

    DragManager.removeDropTarget(this)
    HoverManager.removeHoverable(this)

    const proms: Promise<any>[] = []
    proms.push(this.detachGrid())
    proms.push(this.header.unrender())
    proms.push(this.border.unrender())
    proms.push(this.links.unrender())
    //proms.push(this.borderingLinks.updateLinkEnds()) // TODO: otherwise links reference to not existing borderingBoxes
    proms.push(this.unrenderAdditional())
    await Promise.all(proms)

    this.rendered = false
    return {rendered: false}
  }

  private renderAndRegisterBorderingLinks(): void {
    if (this.isRoot()) {
      return
    }
    const linksToUpdate: Link[] = this.getParent().filterBorderingLinksFor(this.getId())
    linksToUpdate.forEach((link: Link) => {
      link.render()
      this.registerBorderingLink(link)
    })
  }

  public setHighlight(highlight: boolean): void {
    this.border.setHighlight(highlight)
    this.borderingLinks.forEach(link => link.setHighlight(highlight))
  }

  public isMapDataFileExisting(): boolean {
    return this.mapDataFileExists
  }

  private async setMapDataFileExistsAndRenderBorder(exists: boolean): Promise<void> {
    if (this.mapDataFileExists != exists) {
      this.mapDataFileExists = exists
      await this.border.render()
    }
  }

  public getMapLinkData(): BoxMapLinkData[] {
    return this.mapData.links
  }

  public async restoreMapData(): Promise<void> {
    const restoredMapData: BoxMapData|null = await fileSystem.loadFromJsonFile(this.getMapDataFilePath(), BoxMapData.buildFromJson)
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
    await fileSystem.saveToJsonFile(mapDataFilePath, this.mapData)
    util.logInfo('saved ' + mapDataFilePath)
    this.setMapDataFileExistsAndRenderBorder(true)
  }

  public async onDragEnter(): Promise<void> {
    await this.attachGrid(RenderPriority.RESPONSIVE)
  }

  public async onDragLeave(): Promise<void> {
    await this.detachGrid(RenderPriority.RESPONSIVE)
  }

  public async attachGrid(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    await grid.renderInto(this.gridPlaceHolderId, priority)
  }

  public async detachGrid(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    await grid.unrenderFrom(this.gridPlaceHolderId, priority)
  }

  protected async renderStyle(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    const basicStyle: string = 'display:inline-block;position:absolute;overflow:visible;'
    const scaleStyle: string = 'width:' + this.mapData.width + '%;height:' + this.mapData.height + '%;'
    const positionStyle: string = 'left:' + this.mapData.x + '%;top:' + this.mapData.y + '%;'

    await renderManager.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle, priority)
  }

  public async updateMeasuresAndBorderingLinks(
    measuresInPercentIfChanged: {x?: number, y?: number, width?: number, height?: number},
    priority: RenderPriority = RenderPriority.NORMAL
  ): Promise<void> {
    await this.updateMeasures(measuresInPercentIfChanged, priority)
    await Promise.all(this.borderingLinks.map(link => link.render()))
  }

  private async updateMeasures(
    measuresInPercentIfChanged: {x?: number, y?: number, width?: number, height?: number},
    priority: RenderPriority = RenderPriority.NORMAL
  ): Promise<void> {
    if (measuresInPercentIfChanged.x != null) {
      this.mapData.x = measuresInPercentIfChanged.x
    }
    if (measuresInPercentIfChanged.y != null) {
      this.mapData.y = measuresInPercentIfChanged.y
    }
    if (measuresInPercentIfChanged.width != null) {
      this.mapData.width = measuresInPercentIfChanged.width
    }
    if (measuresInPercentIfChanged.height != null) {
      this.mapData.height = measuresInPercentIfChanged.height
    }

    await this.renderStyle(priority)
  }

  protected abstract getBodyOverflowStyle(): 'hidden'|'visible'

  protected abstract renderAdditional(): Promise<void>

  protected abstract unrenderAdditional(): Promise<void>

  protected abstract getBodyId(): string

  protected abstract renderBody(): Promise<void>

  protected abstract unrenderBodyIfPossible(force?: boolean): Promise<{rendered: boolean}>

  protected abstract isBodyRendered(): boolean

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

  public registerBorderingLink(link: Link) {
    if (this.borderingLinks.includes(link)) {
      util.logWarning('trying to register borderingLink that is already registered')
    }
    this.borderingLinks.push(link)
    if (!this.mapDataFileExists) {
      // otherwise managingBox of link would save linkPath with not persisted boxId
      this.saveMapData()
    }
  }

  public deregisterBorderingLink(link: Link) {
    if (!this.borderingLinks.includes(link)) {
      util.logWarning('trying to deregister borderingLink that is not registered')
    }
    this.borderingLinks.splice(this.borderingLinks.indexOf(link), 1)
  }

  public filterBorderingLinksFor(boxId: string): Link[] {
    return this.borderingLinks.filter((link: Link) => {
        return link.getData().from.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxId)
            || link.getData().to.path.some((wayPoint: WayPointData) => wayPoint.boxId === boxId)
      }
    )
  }

  public static findCommonAncestor(fromBox: Box, toBox: Box): {commonAncestor: Box, fromBoxes: Box[], toBoxes: Box[]} | never {
    const fromBoxes: Box[] = [fromBox]
    const toBoxes: Box[] = [toBox]

    let commonAncestorCandidate: Box = fromBox
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
