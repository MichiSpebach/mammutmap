import * as util from '../util'
import * as dom from '../domAdapter'
import { Path } from '../Path'
import { BoxMapData } from './BoxMapData'

export abstract class Box {
  private readonly path: Path
  private readonly id: string
  private mapData: BoxMapData = BoxMapData.buildDefault()
  private dragOffset: {x: number, y: number} = {x:0 , y:0}

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

    dom.addDragListenerTo(headerId, 'dragstart', (clientX:number, clientY: number) => this.setDragOffset(clientX, clientY))
    dom.addDragListenerTo(headerId, 'drag', (clientX:number, clientY: number) => this.changePosition(clientX, clientY))
  }

  private async setDragOffset(clientX: number, clientY: number): Promise<void> {
    let clientRect = await dom.getClientRectOf(this.getId()) // TODO: accelerate, increase responsivity, dont't wait, cache previous rect
    util.logInfo('dragstart, clientRect:' + util.stringify(clientRect) + '; clientX=' + clientX + ', clientY=' + clientY)
    this.dragOffset = {x: clientX - clientRect.x, y: clientY - clientRect.y}
  }

  private async changePosition(clientX: number, clientY: number): Promise<void> {
    let parentClientRect = await dom.getClientRectOf('root') // TODO: accelerate, increase responsivity, dont't wait, cache previous rect

    //util.logInfo('parent:' + util.stringify(parentClientRect) + '; this:' + util.stringify(clientRect) + '; x=' + clientX + ', y=' + clientY)

    this.mapData.x = (clientX - parentClientRect.x - this.dragOffset.x) / parentClientRect.width * 100
    this.mapData.y = (clientY - parentClientRect.y - this.dragOffset.y) / parentClientRect.height * 100

    this.renderStyle()
  }

  protected abstract renderBody(): void

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

}
