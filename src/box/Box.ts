import * as util from '../util'
import * as dom from '../domAdapter'
import { Path } from '../Path'
import { BoxMapData } from './BoxMapData'
import { Rect } from '../Rect'
import { DirectoryBox } from './DirectoryBox'
import { BoxHeader } from './BoxHeader'
import { BoxBorder } from './BoxBorder'

export abstract class Box {
  private readonly path: Path
  private readonly id: string
  private parent: DirectoryBox|null
  private mapData: BoxMapData = BoxMapData.buildDefault()
  private unsavedChanges: boolean = false
  private readonly header: BoxHeader
  private readonly border: BoxBorder

  public constructor(path: Path, id: string, parent: DirectoryBox|null) {
    this.path = path
    this.id = id
    this.parent = parent
    this.header = new BoxHeader(this)
    this.border = new BoxBorder(this)
  }

  public getPath(): Path {
    return this.path
  }

  public getMapDataFilePath(): string {
    return this.getPath().getMapPath() + '.json'
  }

  public getId(): string {
    return this.id
  }

  public getParent(): DirectoryBox|never {
    if (this.parent == null) {
      util.logError('Box.getParent() cannot be called on root.')
    }
    return this.parent
  }

  public async setParentAndFlawlesslyResize(newParent: DirectoryBox): Promise<void> {
    if (this.parent == null) {
      util.logError('Box.setParent() cannot be called on root.')
    }
    const parentClientRect: Promise<Rect> = this.parent.getClientRect()
    const newParentClientRect: Promise<Rect> = newParent.getClientRect()

    this.parent.removeBox(this)
    newParent.addBox(this)
    this.parent = newParent

    const newWidth: number = this.mapData.width * ((await parentClientRect).width / (await newParentClientRect).width)
    const newHeight: number = this.mapData.height * ((await parentClientRect).height / (await newParentClientRect).height)
    this.updateMeasures({width: newWidth, height: newHeight})
  }

  public async getClientRect(): Promise<Rect> {
    // TODO: cache rect for better responsivity?
    // TODO: but then more complex, needs to be updated on many changes, also when parent boxes change
    return await dom.getClientRectOf(this.getId())
  }

  public render(): void {
    this.loadAndProcessMapData()
    this.header.render()
    this.border.render()
    this.renderBody()
  }

  private async loadAndProcessMapData():Promise<void> {
    if (!this.getPath().isRoot()) {
      await util.readFile(this.getMapDataFilePath())
        .then(json => this.mapData = BoxMapData.buildFromJson(json))
        .catch(error => util.logWarning('failed to load ' + this.getMapDataFilePath() + ': ' + error))
    }
    await this.renderStyle()
  }

  public async saveMapData(): Promise<void> {
    const mapDataFilePath: string = this.getMapDataFilePath()
    await util.writeFile(mapDataFilePath, this.mapData.toJson())
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

    this.renderStyle()
  }

  protected abstract renderBody(): void

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

}
