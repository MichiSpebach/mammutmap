import { util } from '../util/util'
import { fileSystem, Dirent } from '../fileSystemAdapter'
import { renderManager } from '../RenderManager'
import { BoxBody } from './BoxBody'
import { Box } from './Box'
import { FileBox } from './FileBox'
import { FolderBox } from './FolderBox'
import { BoxData } from '../mapData/BoxData'
import { SourcelessBox } from './SourcelessBox'
import { BoxMapDataLoader } from './BoxMapDataLoader'
import { ClientPosition } from '../shape/ClientPosition'
import { EmptySpaceFinder } from './EmptySpaceFinder'
import { LocalRect } from '../LocalRect'

export class FolderBoxBody extends BoxBody {
  private readonly referenceFolderBox: FolderBox
  private boxes: Box[] = []
  private tooManyFilesNoticeRendered: boolean = false

  public constructor(referenceBox: FolderBox) {
    super(referenceBox)
    this.referenceFolderBox = referenceBox
  }

  protected async executeRender(): Promise<void> {
    if (!this.isRendered()) {
      await this.loadMapDatasAndCreateBoxes()
    }
    await this.renderBoxes()
  }

  protected async executeUnrenderIfPossible(force?: boolean): Promise<{anyChildStillRendered: boolean}> {
    if (!this.isRendered()) {
      return {anyChildStillRendered: false}
    }

    let anyChildStillRendered: boolean = false
    await Promise.all(this.boxes.map(async (box: Box): Promise<void> => {
      if ((await box.unrenderIfPossible(force)).rendered) {
        anyChildStillRendered = true
      }
    }))

    if (!anyChildStillRendered) {
      await this.unrenderTooManyFilesNotice()
      await this.unrenderBoxPlaceholders()
      await this.destructBoxes()
    }

    return {anyChildStillRendered}
  }

  private async renderTooManyFilesNotice(count: number): Promise<void> {
    if (this.tooManyFilesNoticeRendered) {
      return
    }

    const style = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;'
    let html = `<div id="${this.getTooManyFilesNoticeId()}" style="${style}">`
    html += `There are ${count} files and folders.<br>`
    html += `<button id="${this.getTooManyFilesNoticeButtonId()}">render</button>`
    html += '</div>'
    await renderManager.addContentTo(this.getId(), html)
    await renderManager.addEventListenerTo(this.getTooManyFilesNoticeButtonId(), 'click', async () => {
      await this.unrenderTooManyFilesNotice()
      await this.loadMapDatasAndCreateBoxes(true)
      await this.renderBoxes()
    })

    this.tooManyFilesNoticeRendered = true
  }

  private async unrenderTooManyFilesNotice(): Promise<void> {
    if (!this.tooManyFilesNoticeRendered) {
      return
    }

    await renderManager.removeEventListenerFrom(this.getTooManyFilesNoticeButtonId(), 'click')
    await renderManager.remove(this.getTooManyFilesNoticeId())

    this.tooManyFilesNoticeRendered = false
  }

  private getTooManyFilesNoticeId(): string {
    return this.getId()+'TooManyFiles'
  }

  private getTooManyFilesNoticeButtonId(): string {
    return this.getTooManyFilesNoticeId()+'Button'
  }

  private async loadMapDatasAndCreateBoxes(unlimitedCount: boolean = false): Promise<void> {
    const mapDataLoader = new BoxMapDataLoader(this.referenceFolderBox, this)

    const dirents = await mapDataLoader.loadDirents()

    const sourcesWithLoadedMapData = await mapDataLoader.loadMapDatasOfSourcesWithMapData(dirents.sourcesWithMapData)

    if (sourcesWithLoadedMapData.sourcesWithLoadingFailedMapData.length > 0) {
      dirents.sourcesWithoutMapData = dirents.sourcesWithoutMapData.concat(...sourcesWithLoadedMapData.sourcesWithLoadingFailedMapData)
    }
    const sourcesWithoutMapData = mapDataLoader.filterSourcesWithoutMapData(dirents.sourcesWithoutMapData)

    const mapDataWithoutSourcesLoaded = mapDataLoader.loadMapDatasWithoutSources(dirents.mapDataWithoutSources)

    const sourceCount: number = sourcesWithLoadedMapData.sourcesWithLoadedMapData.length+sourcesWithoutMapData.length
    if (sourceCount > 200 && !unlimitedCount) {
      await this.renderTooManyFilesNotice(sourceCount)
      return
    }

    this.boxes.push(...await Promise.all(this.createBoxesWithMapData(sourcesWithLoadedMapData.sourcesWithLoadedMapData)))
    this.boxes.push(...await Promise.all(this.createBoxesWithoutSourceData(await mapDataWithoutSourcesLoaded)))
    this.boxes.push(...await Promise.all(this.createBoxesWithoutMapData(sourcesWithoutMapData)))
  }

  private createBoxesWithMapData(boxDatas: {source: Dirent, mapData: BoxData}[]): Promise<Box>[] {
    const boxPromises: Promise<Box>[] = []

    for (const boxData of boxDatas) {
      boxPromises.push(this.createBoxAndRenderPlaceholder(boxData.source.name, boxData.source, boxData.mapData, true))
    }

    return boxPromises
  }

  private createBoxesWithoutSourceData(boxDatas: {boxName: string, mapData: BoxData}[]): Promise<Box>[] {
    const boxPromises: Promise<Box>[] = []

    for (const boxData of boxDatas) {
      boxPromises.push(this.createBoxAndRenderPlaceholder(boxData.boxName, undefined, boxData.mapData, true))
    }

    return boxPromises
  }

  private createBoxesWithoutMapData(sources: Dirent[]): Promise<Box>[] {
    const boxPromises: Promise<Box>[] = []

    const emptySpaceFinder = new EmptySpaceFinder(this.boxes.map(box => box.getLocalRectToSave()))
    const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(sources.length)
    if (emptySpaces.length !== sources.length) {
      let message = `Can not load all boxes in ${this.referenceFolderBox.getSrcPath()}`
      message += `, because number of emptySpaces (${emptySpaces.length}) does not match number of sources (${sources.length})`
      message += ', this should never happen.'
      util.logWarning(message)
    }

    for (let i: number = 0; i < sources.length && i < emptySpaces.length; i++) {
      const mapData: BoxData = BoxData.buildNewFromRect(emptySpaces[i])
      boxPromises.push(this.createBoxAndRenderPlaceholder(sources[i].name, sources[i], mapData, false))
    }

    return boxPromises
  }

  public async rearrangeBoxesWithoutMapData(grabbedBox: Box): Promise<void> {
    const boxesWithMapData: Box[] = this.boxes.filter(box => box.isMapDataFileExisting() || box === grabbedBox)
    const boxesWithoutMapData: Box[] = this.boxes.filter(box => !box.isMapDataFileExisting() && box !== grabbedBox)

    const occupiedSpaces: LocalRect[] = boxesWithMapData.map(box => box.getLocalRectToSave())
    if (!boxesWithMapData.includes(grabbedBox)) {
       // in case grabbedBox is dragged from another parent
      occupiedSpaces.push(await this.referenceFolderBox.transform.clientToLocalRect(await grabbedBox.getClientRect()))
    }

    const emptySpaceFinder = new EmptySpaceFinder(occupiedSpaces)
    const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(boxesWithoutMapData.length)
    if (emptySpaces.length !== boxesWithoutMapData.length) {
      let message = `Can not rearrange unplaced boxes in ${this.referenceFolderBox.getSrcPath()}`
      message += `, because number of emptySpaces (${emptySpaces.length}) does not match number of unplaced boxes (${boxesWithoutMapData.length})`
      message += ', this should never happen.'
      util.logWarning(message)
    }

    for (let i: number = 0; i < boxesWithoutMapData.length && i < emptySpaces.length; i++) {
      const box: Box = boxesWithoutMapData[i]
      await box.updateMeasuresAndBorderingLinks(emptySpaces[i])
    }
  }

  private async createBoxAndRenderPlaceholder(name: string, dirEntry: Dirent|undefined, mapData: BoxData, mapDataFileExists: boolean): Promise<Box> {
    let box: Box

    if (!dirEntry) {
      box = new SourcelessBox(name, this.referenceFolderBox, mapData, mapDataFileExists, 'source not found')
    } else if (dirEntry.isDirectory()) {
      box = new FolderBox(name, this.referenceFolderBox, mapData, mapDataFileExists)
    } else if (dirEntry.isFile()) {
      box = new FileBox(name, this.referenceFolderBox, mapData, mapDataFileExists)
    } else {
      box = new SourcelessBox(name, this.referenceFolderBox, mapData, mapDataFileExists, 'is neither file nor directory')
    }
    await this.renderBoxPlaceholderFor(box)

    return box
  }

  private async renderBoxPlaceholderFor(box: Box): Promise<void> {
    const rect: LocalRect = box.getLocalRectToSave()
    let style = `position:absolute;`
    style += `left:${rect.x}%;top:${rect.y}%;width:${rect.width}%;height:${rect.height}%;`
    style += 'overflow:hidden;'
    let onwheel = 'return false/*prevents scrolling*/'
    return renderManager.addContentTo(this.getId(), `<div id="${box.getId()}" style="${style}" onwheel="${onwheel}">wait for box ${box.getName()} to render</div>`)
  }

  private async unrenderBoxPlaceholders(): Promise<void> {
    await renderManager.setContentTo(this.getId(), '')
  }

  private async renderBoxes(): Promise<void> {
    await Promise.all(this.boxes.map(async (box: Box): Promise<void> => {
      await box.render()
    }))
  }

  private async destructBoxes(): Promise<void> {
    const boxes = this.boxes
    this.boxes = []
    await Promise.all(boxes.map(async (box: Box): Promise<void> => {
      await box.destruct()
    }))
  }

  public containsBox(box: Box): boolean {
    return this.boxes.includes(box)
  }

  public containsBoxByName(name: string): boolean {
    return this.boxes.some(box => box.getName() === name)
  }

  public getBox(id: string): Box|undefined {
    return this.boxes.find((candidate: Box) => candidate.getId() === id)
  }

  public getBoxes(): Box[] {
    return this.boxes
  }

  public async addNewFileAndSave(name: string, mapData: BoxData): Promise<void> {
    const newBox: FileBox = new FileBox(name, this.referenceFolderBox, mapData, false, this.referenceFolderBox.context)
    await this.addNewBoxAndSave(newBox, (path: string) => fileSystem.writeFile(path, ""))
  }

  public async addNewFolderAndSave(name: string, mapData: BoxData): Promise<void> {
    const newBox: FolderBox = new FolderBox(name, this.referenceFolderBox, mapData, false, this.referenceFolderBox.context)
    await this.addNewBoxAndSave(newBox, (path: string) => fileSystem.makeFolder(path))
  }

  private async addNewBoxAndSave(box: Box, saveOnFileSystem: (path: string) => Promise<void>) {
    this.boxes.push(box)
    await this.renderBoxPlaceholderFor(box)
    await box.render()
    await saveOnFileSystem(box.getSrcPath())
    await box.saveMapData()
  }

  public async addBox(box: Box): Promise<void> {
    if (this.containsBox(box)) {
      util.logWarning('trying to add box that is already contained')
    }
    this.boxes.push(box)
    return renderManager.appendChildTo(this.getId(), box.getId())
  }

  public removeBox(box: Box): void {
    if (!this.containsBox(box)) {
      util.logWarning('trying to remove box that is not contained')
    }
    this.boxes.splice(this.boxes.indexOf(box), 1)
    // TODO: try to remove from dom?
  }

  // TODO: is this method needed?
  public async getBoxesAt(clientX: number, clientY: number): Promise<Box[]> {
    if (this.referenceFolderBox.site.isDetached()) {
      util.logWarning(`FolderBoxBody::getBoxesAt(..) called on detached box "${this.referenceFolderBox.getName()}" but option to specify whether savedPosition or renderedPosition is not implemented.`)
    }
    let boxesAtPostion:Box[] = []

    for (var i: number = 0; i < this.boxes.length; i++) {
      let box = this.boxes[i]
      let clientRect = await box.getClientRect() // TODO: parallelize, getBoxesAt(..) is called often
      if (clientRect.isPositionInside(new ClientPosition(clientX, clientY))) {
        boxesAtPostion.push(box)
      }
    }

    return boxesAtPostion
  }

}
