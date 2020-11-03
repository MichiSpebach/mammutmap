import * as util from '../util'
import * as dom from '../domAdapter'
import { Path } from '../Path'
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
    let positionStyle: string = 'left:' + this.mapData.x + '%;top:' + this.mapData.y + '%;'
    let borderStyle: string = this.getBorderStyle()

    dom.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle + borderStyle)
  }

  protected abstract getBorderStyle(): string

  private async renderHeader(): Promise<void> {
    let headerId: string = this.getId() + 'header'

    let headerElement: string = '<div id="' + headerId + '" draggable="true" style="background-color:skyblue;">' + this.getPath().getSrcName() + '</div>'
    await dom.setContentTo(this.getId(), headerElement)

    dom.addDragListenerTo(headerId, (x:number, y: number) => this.changePosition(x, y))
  }

  private async changePosition(x: number, y: number): Promise<void> {
    let rect = await dom.getClientRectOf(this.getId()) // TODO: accelerate, increase responsivity, dont't wait, cache previous rect

    if (x == 0 || y == 0 || (this.mapData.x == x && this.mapData.y == y)) {
      return
    }
    util.logInfo('x=' + x + ', y=' + y)

    this.mapData.x = x
    this.mapData.y = y

    this.renderStyle()
  }

  protected abstract renderBody(): void

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

}
