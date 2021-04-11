import * as util from '../util'
import * as fileSystem from '../fileSystemAdapter'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { FileBox } from './FileBox'
import { FolderBox } from './FolderBox'

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

    await this.renderBoxes()
    this.rendered = true
  }

  private async renderBoxes(): Promise<void> {
    await Promise.all(fileSystem.readdirSync(this.referenceBox.getSrcPath()).map(async (dirEntry) => { // TODO: use read async
      const name: string = dirEntry.name
      const path: string = this.referenceBox.getSrcPath() + '/' + name

      if (dirEntry.isDirectory()) {
        util.logInfo('Box::render folder ' + path)
        this.boxes.push(await this.createFolderBox(name))

      } else if (dirEntry.isFile()) {
        util.logInfo('Box::render file ' + path)
        this.boxes.push(await this.createFileBox(name))

      } else {
        util.logError('Box::render ' + path + ' is neither file nor directory.')
      }
    }))

    await Promise.all(this.boxes.map(async (box: Box): Promise<void> => {
      await box.render()
    }))
  }

  private async createFolderBox(name: string): Promise<FolderBox> {
    const boxData = await Box.prepareConstructor(name, this.referenceBox)
    const box = new FolderBox(name, this.referenceBox, boxData.mapData, boxData.mapDataFileExists)
    await this.renderBoxPlaceholderFor(box)
    return box
  }

  private async createFileBox(name: string): Promise<FileBox> {
    const boxData = await Box.prepareConstructor(name, this.referenceBox)
    const box = new FileBox(name, this.referenceBox, boxData.mapData, boxData.mapDataFileExists)
    await this.renderBoxPlaceholderFor(box)
    return box
  }

  private async renderBoxPlaceholderFor(box: Box): Promise<void> {
    return dom.addContentTo(this.getId(), '<div id="' + box.getId() + '" style="display:inline-block;">loading... ' + box.getName() + '</div>')
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
