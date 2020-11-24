import * as util from '../util'
import * as dom from '../domAdapter'
import { Path } from '../Path'
import { BoxMapData } from './BoxMapData'
import { Rect } from '../Rect'
import { DragManager } from '../DragManager'
import { DirectoryBox } from './DirectoryBox'

export abstract class Box {
  private readonly path: Path
  private readonly id: string
  private parent: DirectoryBox|null
  private mapData: BoxMapData = BoxMapData.buildDefault()
  private dragOffset: {x: number, y: number} = {x:0 , y:0}
  private hide: boolean = false

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

  public getHeaderId(): string {
    return this.getId() + 'header'
  }

  public getParent(): DirectoryBox|never {
    if (this.parent == null) {
      util.logError('Box.getParent() cannot be called on root.')
    }
    return this.parent
  }

  public async getClientRect(): Promise<Rect> {
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
    let basicStyle: string = this.getDisplayStyle() + 'position:absolute;overflow:' + this.getOverflow() + ';'
    let scaleStyle: string = 'width:' + this.mapData.width + '%;height:' + this.mapData.height + '%;'
    let positionStyle: string = 'left:' + this.mapData.x + '%;top:' + this.mapData.y + '%;'
    let borderStyle: string = this.getBorderStyle()

    return dom.setStyleTo(this.getId(), basicStyle + scaleStyle + positionStyle + borderStyle)
  }

  private getDisplayStyle(): string {
    if (this.hide) {
      return 'display:none;'
    } else {
      return 'display:inline-block;'
    }
  }

  protected abstract getOverflow(): 'hidden'|'visible'

  protected abstract getBorderStyle(): string

  private async renderHeader(): Promise<void> {
    let headerElement: string = '<div id="' + this.getHeaderId() + '" style="background-color:skyblue;">' + this.getPath().getSrcName() + '</div>'
    await dom.setContentTo(this.getId(), headerElement)

    DragManager.addDraggable(this) // TODO: move to other method
  }

  public getDraggableId(): string {
    return this.getHeaderId()
  }

  public async dragStart(clientX: number, clientY: number): Promise<void> {
    let clientRect: Rect = await this.getClientRect()
    this.dragOffset = {x: clientX - clientRect.x, y: clientY - clientRect.y}

    this.hide = true
    this.renderStyle()
  }

  public async drag(clientX: number, clientY: number): Promise<void> {
    /*if (!parentClientRect.isPositionInside(clientX, clientY)) {
      await this.moveOut()
      this.drag(clientX, clientY)
      return
    }
    let boxesAtPostion = await this.getParent().getBoxesAt(clientX, clientY)
    let boxToMoveInside: DirectoryBox|null = null
    for (let i:number = 0; i < boxesAtPostion.length; i++) {
      let box = boxesAtPostion[i]
      if (box != this && box instanceof DirectoryBox) {
        boxToMoveInside = box
        break
      }
    }
    if (boxToMoveInside != null) {
      boxToMoveInside.addBox(this)
      boxToMoveInside.setDragOverStyle(true)
      this.getParent().removeBox(this)
      this.getParent().setDragOverStyle(false)

      this.parent = boxToMoveInside
      this.renderStyle()
      return
    }*/
  }

  public async dragEnd(clientX: number, clientY: number): Promise<void> {
    let parentClientRect: Rect = await this.getParent().getClientRect()

    this.mapData.x = (clientX - parentClientRect.x - this.dragOffset.x) / parentClientRect.width * 100
    this.mapData.y = (clientY - parentClientRect.y - this.dragOffset.y) / parentClientRect.height * 100

    this.hide = false
    this.renderStyle()
  }

  private async moveOut(): Promise<void> {
    let oldParent: DirectoryBox = this.getParent()
    let newParent: DirectoryBox = oldParent.getParent()

    let oldParentClientRectPromise = oldParent.getClientRect()
    let newParentClientRectPromise = newParent.getClientRect()
    let oldParentClientRect:Rect = await oldParentClientRectPromise
    let newParentClientRect:Rect = await newParentClientRectPromise

    this.mapData.width *= oldParentClientRect.width / newParentClientRect.width
    this.mapData.height *= oldParentClientRect.height / newParentClientRect.height

    newParent.addBox(this)
    newParent.setDragOverStyle(true)
    oldParent.removeBox(this)
    oldParent.setDragOverStyle(false)

    this.parent = newParent
    this.renderStyle() // TODO: add await to prevent flickering
  }

  protected abstract renderBody(): void

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

}
