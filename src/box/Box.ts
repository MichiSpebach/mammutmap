import * as util from '../util'
import * as fileSystem from '../fileSystemAdapter'
import * as dom from '../domAdapter'
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
import { DropTarget } from '../DropTarget'
import { DragManager } from '../DragManager'
import { HoverManager } from '../HoverManager'

export abstract class Box implements DropTarget {
  private name: string
  private parent: FolderBox|null
  private mapData: BoxMapData
  private mapDataFileExists: boolean
  private readonly header: BoxHeader
  private readonly border: BoxBorder
  public readonly links: BoxLinks
  private readonly borderingLinks: Link[] = [] // TODO: move into BoxLinks?
  private rendered: boolean = false
  private dragOver: boolean = false
  private unsavedChanges: boolean = false

  public constructor(name: string, parent: FolderBox|null, mapData: BoxMapData, mapDataFileExists: boolean) {
    this.name = name
    this.parent = parent
    this.mapData = mapData
    this.mapDataFileExists = mapDataFileExists
    this.header = this.createHeader()
    this.border = new BoxBorder(this)
    this.links = new BoxLinks(this)

    boxManager.addBox(this)
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
    // TODO: cache rect for better responsivity?
    // TODO: but then more complex, needs to be updated on many changes, also when parent boxes change
    return await dom.getClientRectOf(this.getId())
  }

  // TODO: introduce PercentPosition/PercentPoint and ClientPosition/ClientPoint/ClientPixelPosition/ClientPixelPoint?
  public async transformClientPositionToLocal(clientX: number, clientY: number): Promise<{x: number, y: number}> {
    const clientRect: Rect = await this.getClientRect()
    const x: number = (clientX - clientRect.x) / clientRect.width * 100
    const y: number = (clientY - clientRect.y) / clientRect.height * 100
    return {x: x, y: y}
  }

  public transformLocalToParent(x: number, y: number): {x: number, y: number} {
    const xTransformed: number = this.mapData.x + x * (this.mapData.width/100)
    const yTransformed: number = this.mapData.y + y * (this.mapData.height/100)
    return {x: xTransformed, y: yTransformed}
  }

  public async render(): Promise<void> {
    if (!this.isRendered()) {
      this.renderStyle()

      // TODO: add placeholders before so that render order does no longer matter?
      await this.header.render()
      await this.border.render()
    }

    await this.renderBody()
    if (this.isBodyRendered()) {
      await this.links.render()
    }

    if (!this.isRendered()) {
      DragManager.addDropTarget(this)
      HoverManager.addHoverable(this, () => this.setHighlight(true), () => this.setHighlight(false))
    }

    this.renderAdditional()
    this.rendered = true
  }

  private setHighlight(highlight: boolean): void {
    this.borderingLinks.forEach(link => link.setHighlight(highlight))
  }

  public isMapDataFileExisting(): boolean {
    return this.mapDataFileExists
  }

  private async setMapDataFileExistingAndRenderBorder(exists: boolean): Promise<void> {
    if (this.mapDataFileExists != exists) {
      this.mapDataFileExists = exists
      await this.border.render()
    }
  }

  public getMapLinkData(): BoxMapLinkData[] {
    return this.mapData.links
  }

  public async restoreMapData(): Promise<void> {
    const restoredMapData: BoxMapData|null = await fileSystem.loadMapData(this.getMapDataFilePath())
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
    await fileSystem.writeFile(mapDataFilePath, this.mapData.toJson())
      .then(() => {
        util.logInfo('saved ' + mapDataFilePath)
        this.setMapDataFileExistingAndRenderBorder(true)
      })
      .catch(error => util.logWarning('failed to save ' + mapDataFilePath + ': ' + error))
  }

  public async setDragOverStyle(value: boolean): Promise<void> {
    this.dragOver = value

    if (this.dragOver) {
      dom.addClassTo(this.getId(), style.getHighlightBoxClass())
    } else {
      dom.removeClassFrom(this.getId(), style.getHighlightBoxClass())
    }
  }

  protected async renderStyle(): Promise<void> {
    const basicStyle: string = 'display:inline-block;position:absolute;overflow:' + this.getOverflow() + ';'
    const scaleStyle: string = 'width:' + this.mapData.width + '%;height:' + this.mapData.height + '%;'
    const positionStyle: string = 'left:' + this.mapData.x + '%;top:' + this.mapData.y + '%;'

    return dom.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle)
  }

  protected abstract getOverflow(): 'hidden'|'visible'

  public async updateMeasuresAndBorderingLinks(measuresInPercentIfChanged: {x?: number, y?: number, width?: number, height?: number}): Promise<void> {
    await this.updateMeasures(measuresInPercentIfChanged)
    await Promise.all(this.borderingLinks.map(link => link.render()))
  }

  private async updateMeasures(measuresInPercentIfChanged: {x?: number, y?: number, width?: number, height?: number}): Promise<void> {
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

    await this.renderStyle()
  }

  protected async abstract renderAdditional(): Promise<void>

  protected async abstract renderBody(): Promise<void>

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
  }

  public deregisterBorderingLink(link: Link) {
    if (!this.borderingLinks.includes(link)) {
      util.logWarning('trying to deregister borderingLink that is not registered')
    }
    this.borderingLinks.splice(this.borderingLinks.indexOf(link), 1)
  }

}
