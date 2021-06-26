import * as util from '../util'
import * as fileSystem from '../fileSystemAdapter'
import * as dom from '../domAdapter'
import { Dirent } from 'original-fs'
import { settings } from '../Settings'
import { Rect } from '../Rect'
import { Box } from './Box'
import { FileBox } from './FileBox'
import { FolderBox } from './FolderBox'
import { BoxMapData } from './BoxMapData'

export class FolderBoxBody {
  private readonly referenceBox: FolderBox
  private boxes: Box[] = []
  private rendered: boolean = false
  private renderInProgress = false
  private rerenderAfterRenderFinished = false

  public constructor(referenceBox: FolderBox) {
    this.referenceBox = referenceBox
  }

  public getId(): string {
    return this.referenceBox.getId() + 'body'
  }

  public isRendered(): boolean {
    return this.rendered
  }

  public async render(): Promise<void> {
    if (this.renderInProgress) {
      this.rerenderAfterRenderFinished = true
      return
    }
    this.renderInProgress = true // TODO: make atomic with if statement

    if (! await this.shouldBeRendered()) {
      this.renderInProgress = false
      return
    }

    if (!this.rendered) {
      let html: string = '<div id="' + this.getId() + '"></div>'
      await dom.addContentTo(this.referenceBox.getId(), html)
      await this.loadMapDatasAndCreateBoxes()
    }
    await this.renderBoxes()

    this.rendered = true
    this.renderInProgress = false

    if (this.rerenderAfterRenderFinished) {
      this.rerenderAfterRenderFinished = false
      this.render()
    }
  }

  private async shouldBeRendered(): Promise<boolean> {
    const boxRect: Rect = await dom.getClientRectOf(this.referenceBox.getId())
    return this.isRectLargeEnoughToRender(boxRect) && this.isRectInsideScreen(boxRect)
  }

  private isRectLargeEnoughToRender(rect: Rect): boolean {
    return (rect.width+rect.height)/2 >= settings.getBoxMinSizeToRender()
  }

  private isRectInsideScreen(rect: Rect): boolean {
    if (rect.x+rect.width < 0) {
      return false
    }
    if (rect.y+rect.height < 0) {
      return false
    }

    const clientSize = dom.getClientSize()
    if (rect.x > clientSize.width) {
      return false
    }
    if (rect.y > clientSize.height) {
      return false
    }

    return true
  }

  private async loadMapDatasAndCreateBoxes(): Promise<void> {
    const boxesWithMapData: {dirEntry: Dirent, mapData: BoxMapData}[] = []
    const boxesWithoutMapData: {dirEntry: Dirent}[] = []

    const sourcePaths: Dirent[] = await fileSystem.readdir(this.referenceBox.getSrcPath())
    await Promise.all(sourcePaths.map(async (dirEntry: Dirent) => {
      const name: string = dirEntry.name
      const mapPath: string = this.referenceBox.getMapPath()+'/'+name+'.json'

      const mapData: BoxMapData|null = await fileSystem.loadMapData(mapPath)

      if (mapData !== null) {
        boxesWithMapData.push({dirEntry, mapData}) // TODO: can this lead to race conditions because of async?
      } else {
        boxesWithoutMapData.push({dirEntry})
      }
    }))

    await this.addBoxesWithMapData(boxesWithMapData);
    await this.addBoxesWithoutMapData(boxesWithoutMapData);
  }

  private async addBoxesWithMapData(boxes: {dirEntry: Dirent, mapData: BoxMapData}[]): Promise<void> {
    await Promise.all(boxes.map(async (data: {dirEntry: Dirent, mapData: BoxMapData}) => {
      this.boxes.push(await this.createBoxAndRenderPlaceholder(data.dirEntry, data.mapData, true))
    }))
  }

  private async addBoxesWithoutMapData(boxes: {dirEntry: Dirent}[] = []): Promise<void> {
    const gridSize: number = Math.ceil(Math.sqrt(boxes.length))
    const cellSize = 100/gridSize
    const boxSize: number = 100/(gridSize+1)
    const spaceBetweenBoxes: number = cellSize-boxSize

    let arrayIndex: number = boxes.length-1
    for (let rowIndex: number = gridSize-1; rowIndex>=0; rowIndex--) {
      for (let columnIndex: number = gridSize-1; columnIndex>=0 && arrayIndex>=0; columnIndex--, arrayIndex--) {
        const mapData: BoxMapData = BoxMapData.buildNew(spaceBetweenBoxes/2 + columnIndex*cellSize, spaceBetweenBoxes/2 + rowIndex*cellSize, boxSize, boxSize)
        this.boxes.push(await this.createBoxAndRenderPlaceholder(boxes[arrayIndex].dirEntry, mapData, false))
      }
    }
  }

  private async createBoxAndRenderPlaceholder(dirEntry: Dirent, mapData: BoxMapData, mapDataFileExists: boolean): Promise<Box> {
    let box: Box

    if (dirEntry.isDirectory()) {
      box = new FolderBox(dirEntry.name, this.referenceBox, mapData, mapDataFileExists)
    } else if (dirEntry.isFile()) {
      box = new FileBox(dirEntry.name, this.referenceBox, mapData, mapDataFileExists)
    } else {
      util.logError(this.referenceBox.getMapPath()+'/'+dirEntry+' is neither file nor directory.')
    }
    await this.renderBoxPlaceholderFor(box)

    return box
  }

  private async renderBoxPlaceholderFor(box: Box): Promise<void> {
    return dom.addContentTo(this.getId(), '<div id="' + box.getId() + '" style="display:inline-block;">loading... ' + box.getName() + '</div>')
  }

  private async renderBoxes(): Promise<void> {
    await Promise.all(this.boxes.map(async (box: Box): Promise<void> => {
      await box.render()
    }))
  }

  public containsBox(box: Box): boolean {
    return this.boxes.includes(box)
  }

  public getBox(id: string): Box|never {
    const box: Box|undefined = this.boxes.find((candidate: Box) => candidate.getId() === id)
    if (!box) {
      util.logError(this.referenceBox.getSrcPath() + ' does not contain a box with id ' + id)
    }
    return box
  }

  public async addBox(box: Box): Promise<void> {
    if (this.containsBox(box)) {
      util.logWarning('trying to add box that is already contained')
    }
    this.boxes.push(box)
    return dom.appendChildTo(this.getId(), box.getId())
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
    let boxesAtPostion:Box[] = []

    for (var i: number = 0; i < this.boxes.length; i++) {
      let box = this.boxes[i]
      let clientRect = await box.getClientRect() // TODO: parallelize, getBoxesAt(..) is called often
      if (clientRect.isPositionInside(clientX, clientY)) {
        boxesAtPostion.push(box)
      }
    }

    return boxesAtPostion
  }

}
