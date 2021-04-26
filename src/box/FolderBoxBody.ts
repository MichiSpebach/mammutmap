import * as util from '../util'
import * as fileSystem from '../fileSystemAdapter'
import * as dom from '../domAdapter'
import { Dirent } from 'original-fs'
import { Box } from './Box'
import { FileBox } from './FileBox'
import { FolderBox } from './FolderBox'
import { BoxMapData } from './BoxMapData'

export class FolderBoxBody {
  private readonly referenceBox: FolderBox
  private boxes: Box[] = []
  private rendered: boolean = false

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
    let html: string = '<div id="' + this.getId() + '"></div>'
    await dom.addContentTo(this.referenceBox.getId(), html)

    if (!this.rendered) {
      await this.loadMapDatasAndCreateBoxes()
    }
    await this.renderBoxes()
    this.rendered = true
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

    await Promise.all(boxesWithMapData.map((data: {dirEntry: Dirent, mapData: BoxMapData}) => {
      this.boxes.push(this.createBox(data.dirEntry, data.mapData, true))
    }))

    await Promise.all(boxesWithoutMapData.map((data: {dirEntry: Dirent}) => {
      this.boxes.push(this.createBox(data.dirEntry, BoxMapData.buildNew(10, 10, 80, 80), false))
      // TODO: wip
    }))

    await Promise.all(this.boxes.map(async box => {
      await this.renderBoxPlaceholderFor(box)
    }))
  }

  private createBox(dirEntry: Dirent, mapData: BoxMapData, mapDataFileExists: boolean): Box {
    if (dirEntry.isDirectory()) {
      return new FolderBox(dirEntry.name, this.referenceBox, mapData, mapDataFileExists)
    } else if (dirEntry.isFile()) {
      return new FileBox(dirEntry.name, this.referenceBox, mapData, mapDataFileExists)
    } else {
      util.logError(this.referenceBox.getMapPath()+'/'+dirEntry+' is neither file nor directory.')
    }
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
