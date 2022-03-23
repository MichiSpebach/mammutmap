import { util } from '../util'
import { fileSystem } from '../fileSystemAdapter'
import { renderManager } from '../RenderManager'
import { Dirent } from 'original-fs'
import { BoxBody } from './BoxBody'
import { Box } from './Box'
import { FileBox } from './FileBox'
import { FolderBox } from './FolderBox'
import { BoxMapData } from './BoxMapData'

export class FolderBoxBody extends BoxBody {
  private readonly referenceFolderBox: FolderBox
  private boxes: Box[] = []

  public constructor(referenceBox: FolderBox) {
    super(referenceBox)
    this.referenceFolderBox = referenceBox
  }

  public async executeRender(): Promise<void> {
    if (!this.isRendered()) {
      await this.loadMapDatasAndCreateBoxes()
    }
    await this.renderBoxes()
  }

  public async executeUnrenderIfPossible(force?: boolean): Promise<{rendered: boolean}> {
    if (!this.isRendered()) {
      return {rendered: false}
    }

    let rendered: boolean = false
    await Promise.all(this.boxes.map(async (box: Box): Promise<void> => {
      if ((await box.unrenderIfPossible(force)).rendered) {
        rendered = true
      }
    }))
    if (!rendered) {
      await this.unrenderBoxPlaceholders()
      await this.destructBoxes()
    }
    return {rendered: rendered}
  }

  private async loadMapDatasAndCreateBoxes(): Promise<void> {
    const boxDataPromises: {sourcePath: Dirent, mapData: Promise<BoxMapData|null>}[] = []
    const sourcePaths: Dirent[] = await fileSystem.readdir(this.referenceFolderBox.getSrcPath())

    for (const sourcePath of sourcePaths) {
      if (this.boxes.find(box => box.getName() === sourcePath.name)) {
        continue
      }
      const mapPath: string = this.referenceFolderBox.getMapPath()+'/'+sourcePath.name+'.json'
      boxDataPromises.push({sourcePath, mapData: fileSystem.loadFromJsonFile(mapPath, BoxMapData.buildFromJson)})
    }

    const boxesWithMapData: {sourcePath: Dirent, mapData: BoxMapData}[] = []
    const boxesWithoutMapData: {sourcePath: Dirent}[] = []

    for (const boxDataPromise of boxDataPromises) {
      const sourcePath: Dirent = boxDataPromise.sourcePath
      const mapData: BoxMapData|null = await boxDataPromise.mapData
      if (mapData !== null) {
        boxesWithMapData.push({sourcePath, mapData})
      } else {
        boxesWithoutMapData.push({sourcePath})
      }
    }

    this.boxes.push(...await Promise.all(this.createBoxesWithMapData(boxesWithMapData)))
    this.boxes.push(...await Promise.all(this.createBoxesWithoutMapData(boxesWithoutMapData)))
  }

  private createBoxesWithMapData(boxDatas: {sourcePath: Dirent, mapData: BoxMapData}[]): Promise<Box>[] {
    const boxPromises: Promise<Box>[] = []
    
    for (const boxData of boxDatas) {
      boxPromises.push(this.createBoxAndRenderPlaceholder(boxData.sourcePath, boxData.mapData, true))
    }

    return boxPromises
  }

  private createBoxesWithoutMapData(boxDatas: {sourcePath: Dirent}[] = []): Promise<Box>[] {
    const boxPromises: Promise<Box>[] = []

    const gridSize: number = Math.ceil(Math.sqrt(boxDatas.length))
    const cellSize = 100/gridSize
    const boxSize: number = 100/(gridSize*1.75)
    const spaceBetweenBoxes: number = cellSize-boxSize

    let arrayIndex: number = boxDatas.length-1
    for (let rowIndex: number = gridSize-1; rowIndex>=0; rowIndex--) {
      for (let columnIndex: number = gridSize-1; columnIndex>=0 && arrayIndex>=0; columnIndex--, arrayIndex--) {
        const mapData: BoxMapData = BoxMapData.buildNew(spaceBetweenBoxes/2 + columnIndex*cellSize, spaceBetweenBoxes/2 + rowIndex*cellSize, boxSize, boxSize)
        boxPromises.push(this.createBoxAndRenderPlaceholder(boxDatas[arrayIndex].sourcePath, mapData, false))
      }
    }

    return boxPromises
  }

  private async createBoxAndRenderPlaceholder(dirEntry: Dirent, mapData: BoxMapData, mapDataFileExists: boolean): Promise<Box> {
    let box: Box

    if (dirEntry.isDirectory()) {
      box = new FolderBox(dirEntry.name, this.referenceFolderBox, mapData, mapDataFileExists)
    } else if (dirEntry.isFile()) {
      box = new FileBox(dirEntry.name, this.referenceFolderBox, mapData, mapDataFileExists)
    } else {
      util.logError(this.referenceFolderBox.getMapPath()+'/'+dirEntry+' is neither file nor directory.')
    }
    await this.renderBoxPlaceholderFor(box)

    return box
  }

  private async renderBoxPlaceholderFor(box: Box): Promise<void> {
    return renderManager.addContentTo(this.getId(), '<div id="' + box.getId() + '" style="display:inline-block;">loading... ' + box.getName() + '</div>')
  }

  private async unrenderBoxPlaceholders(): Promise<void> {
    await renderManager.setContentTo(this.getId(), '')
  }

  private async renderBoxes(): Promise<void> {
    await Promise.all(this.boxes.map(async (box: Box): Promise<void> => {
      await box.render()
    }))
  }

  private async destructBoxes(): Promise<void> {
    await Promise.all(this.boxes.map(async (box: Box): Promise<void> => {
      await box.destruct()
    }))
    this.boxes = []
  }

  public containsBox(box: Box): boolean {
    return this.boxes.includes(box)
  }

  public getBox(id: string): Box|never {
    const box: Box|undefined = this.boxes.find((candidate: Box) => candidate.getId() === id)
    if (!box) {
      util.logError(this.referenceFolderBox.getSrcPath() + ' does not contain a box with id ' + id)
    }
    return box
  }

  public getBoxes(): Box[] {
    return this.boxes
  }

  public async addNewFileAndSave(name: string, mapData: BoxMapData): Promise<void> {
    const newBox: FileBox = new FileBox(name, this.referenceFolderBox, mapData, false)
    await this.addNewBoxAndSave(newBox, (path: string) => fileSystem.writeFile(path, ""))
  }

  public async addNewFolderAndSave(name: string, mapData: BoxMapData): Promise<void> {
    const newBox: FolderBox = new FolderBox(name, this.referenceFolderBox, mapData, false)
    await this.addNewBoxAndSave(newBox, fileSystem.makeFolder)
  }

  private async addNewBoxAndSave(box: Box, saveOnFileSystem: (path: string) => Promise<void>) {
    this.boxes.push(box)
    await this.renderBoxPlaceholderFor(box)
    await box.render()
    await saveOnFileSystem(box.getSrcPath())
    await box.saveMapData()
  }

  public async addBox(box: Box): Promise<void> {
    if (this.containsBox(box)) {
      util.logWarning('trying to add box that is already contained')
    }
    this.boxes.push(box)
    return renderManager.appendChildTo(this.getId(), box.getId())
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
