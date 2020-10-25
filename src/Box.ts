import * as util from './util'
import { Path } from './Path'
import { BoxMapData } from './BoxMapData'

export abstract class Box {
  private readonly path: Path
  private readonly id: string
  private mapData: BoxMapData = BoxMapData.buildDefault()

  public constructor(path: Path, id: string) {
    this.path = path
    this.id = id
  }

  protected getPath(): Path {
    return this.path
  }

  protected getId(): string {
    return this.id
  }

  public render(): void {
    this.loadAndProcessMapData()
    this.renderHeader()
    this.renderBody()
  }

  private async loadAndProcessMapData():Promise<void> {
    if (!this.getPath().isRoot()) {
      await util.readFile(this.getPath().getMapPath() + '.json')
      .then(json => this.mapData = BoxMapData.buildFromJson(json))
      .catch(error => util.logWarning('failed to load ' + this.getPath().getMapPath() + '.json: ' + error))
    }
    this.renderStyle()
  }

  private renderStyle(): void {
    let basicStyle: string = 'display:inline-block;position:absolute;overflow:hidden;'//auto;'
    let scaleStyle: string = 'width:' + this.mapData.width + '%;height:' + this.mapData.height + '%;'
    let positionStyle: string = 'margin-left:' + this.mapData.x + '%;margin-top:' + this.mapData.y + '%;'
    let borderStyle: string = this.getBorderStyle()

    util.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle + borderStyle)
  }

  protected abstract getBorderStyle(): string

  private renderHeader(): void {
    let headerElement: string = '<div style="background-color:skyblue;">' + this.getPath().getSrcName() + '</div>'
    util.setContentTo(this.getId(), headerElement)
  }

  protected abstract renderBody(): void

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

}
