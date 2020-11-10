import * as util from '../util'
import * as dom from '../domAdapter'
import { Path } from '../Path'
import { BoxMapData } from './BoxMapData'
import { Rect } from '../Rect'
import { DirectoryBox } from './DirectoryBox'

export abstract class Box {
  private readonly path: Path
  private readonly id: string
  private parent: DirectoryBox|null
  private mapData: BoxMapData = BoxMapData.buildDefault()
  private dragOffset: {x: number, y: number} = {x:0 , y:0}

  public constructor(path: Path, id: string, parent: DirectoryBox|null) {
    this.path = path
    this.id = id
    this.parent = parent
  }

  public getPath(): Path {
    return this.path
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

  private async getClientRect(): Promise<Rect> {
    // TODO: cache rect for better responsivity?
    // TODO: but then more complex, needs to be updated on many changes, also when parent boxes change
    return await dom.getClientRectOf(this.getId())
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
    await this.renderStyle()
  }

  protected renderStyle(): Promise<void> {
    let basicStyle: string = 'display:inline-block;position:absolute;overflow:' + this.getOverflow() + ';'
    let scaleStyle: string = 'width:' + this.mapData.width + '%;height:' + this.mapData.height + '%;'
    let positionStyle: string = 'left:' + this.mapData.x + '%;top:' + this.mapData.y + '%;'
    let borderStyle: string = this.getBorderStyle()

    return dom.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle + borderStyle)
  }

  protected abstract getOverflow(): 'hidden'|'visible'

  protected abstract getBorderStyle(): string

  private async renderHeader(): Promise<void> {
    let headerId: string = this.getId() + 'header'

    let headerElement: string = '<div id="' + headerId + '" draggable="true" style="background-color:skyblue;">' + this.getPath().getSrcName() + '</div>'
    await dom.setContentTo(this.getId(), headerElement)

    dom.addDragListenerTo(headerId, 'dragstart', (clientX:number, clientY: number) => this.dragStart(clientX, clientY))
    dom.addDragListenerTo(headerId, 'drag', (clientX:number, clientY: number) => this.drag(clientX, clientY))
    dom.addDragListenerTo(headerId, 'dragend', (_) => this.dragend())
  }

  private async dragStart(clientX: number, clientY: number): Promise<void> {
    let clientRect: Rect = await this.getClientRect()
    this.dragOffset = {x: clientX - clientRect.x, y: clientY - clientRect.y}
    this.getParent().setDragOverStyle(true)
  }

  private async drag(clientX: number, clientY: number): Promise<void> {
    let parentClientRect: Rect = await this.getParent().getClientRect() // TODO: cache for better responsivity, as long as dragging is in progress

    if (!parentClientRect.isPositionInside(clientX, clientY)) {
      let oldParent: DirectoryBox = this.getParent()
      let newParent: DirectoryBox = oldParent.getParent()

      // TODO: scale mapData

      newParent.addBox(this)
      newParent.setDragOverStyle(true)
      oldParent.removeBox(this)
      oldParent.setDragOverStyle(false)

      this.parent = newParent
      this.drag(clientX, clientY)
      return
    }

    this.mapData.x = (clientX - parentClientRect.x - this.dragOffset.x) / parentClientRect.width * 100
    this.mapData.y = (clientY - parentClientRect.y - this.dragOffset.y) / parentClientRect.height * 100

    this.renderStyle()
  }

  private async dragend(): Promise<void> {
    return this.getParent().setDragOverStyle(false)
  }

  protected abstract renderBody(): void

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

}
