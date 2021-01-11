import * as util from '../util'
import * as fileSystem from '../fileSystemAdapter'
import * as dom from '../domAdapter'
import { BoxMapData } from './BoxMapData'
import { Rect } from '../Rect'
import { DirectoryBox } from './DirectoryBox'
import { BoxHeader } from './BoxHeader'
import { BoxBorder } from './BoxBorder'

export abstract class Box {
  private readonly id: string
  private name: string
  private parent: DirectoryBox|null
  private mapData: BoxMapData = BoxMapData.buildDefault()
  private mapDataFileExists: boolean = false
  private unsavedChanges: boolean = false
  private readonly header: BoxHeader
  private readonly border: BoxBorder

  public constructor(id: string, name: string, parent: DirectoryBox|null) {
    this.id = id
    this.name = name
    this.parent = parent
    this.header = this.createHeader()
    this.border = new BoxBorder(this)
  }

  protected abstract createHeader(): BoxHeader // TODO: make this somehow a constructor argument for subclasses

  public getId(): string {
    return this.id
  }

  public getName(): string {
    return this.name
  }

  public getSrcPath(): string {
    return this.getParent().getSrcPath() + '/' + this.name
  }

  public getMapPath(): string {
    return this.getParent().getMapPath() + '/' + this.name
  }

  public getMapDataFilePath(): string {
    return this.getMapPath() + '.json'
  }

  public getParent(): DirectoryBox|never {
    if (this.parent == null) {
      util.logError('Box.getParent() cannot be called on root.')
    }
    return this.parent
  }

  public async setParentAndFlawlesslyResizeAndSave(newParent: DirectoryBox): Promise<void> {
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
    if (this.mapDataFileExists) {
      await fileSystem.rename(oldMapDataFilePath, newMapDataFilePath)
      util.logInfo('moved ' + oldMapDataFilePath + ' to ' + newMapDataFilePath)
    }
    await this.saveMapData()
  }

  public async getClientRect(): Promise<Rect> {
    // TODO: cache rect for better responsivity?
    // TODO: but then more complex, needs to be updated on many changes, also when parent boxes change
    return await dom.getClientRectOf(this.getId())
  }

  public async render(): Promise<void> {
    this.mapData = await this.loadMapData()
    this.renderStyle()
    this.header.render()
    this.border.render()
    this.renderBody()
  }

  protected async loadMapData():Promise<BoxMapData> {
    return fileSystem.readFile(this.getMapDataFilePath())
      .then(json => {
        this.mapDataFileExists = true
        return BoxMapData.buildFromJson(json)
      })
      .catch(error => {
        util.logWarning('failed to load ' + this.getMapDataFilePath() + ': ' + error)
        this.mapDataFileExists = false
        return BoxMapData.buildDefault()
      })
  }

  public async restoreMapData(): Promise<void> {
    this.mapData = await this.loadMapData()
    this.renderStyle()
  }

  public async saveMapData(): Promise<void> {
    const mapDataFilePath: string = this.getMapDataFilePath()
    await fileSystem.writeFile(mapDataFilePath, this.mapData.toJson())
      .then(() => util.logInfo('saved ' + mapDataFilePath))
      .catch(error => util.logWarning('failed to save ' + mapDataFilePath + ': ' + error))
  }

  protected renderStyle(): Promise<void> {
    let basicStyle: string = 'display:inline-block;position:absolute;overflow:' + this.getOverflow() + ';'
    let scaleStyle: string = 'width:' + this.mapData.width + '%;height:' + this.mapData.height + '%;'
    let positionStyle: string = 'left:' + this.mapData.x + '%;top:' + this.mapData.y + '%;'

    return dom.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle + this.getAdditionalStyle())
  }

  protected abstract getOverflow(): 'hidden'|'visible'

  protected abstract getAdditionalStyle(): string|null

  public async updateMeasures(measuresInPercentIfChanged: {x?: number, y?: number, width?: number, height?: number}): Promise<void> {
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

  protected abstract renderBody(): void

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

}
