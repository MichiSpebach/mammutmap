import * as util from '../util'
import * as fileSystem from '../fileSystemAdapter'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { FileBox } from './FileBox'
import { FolderBox } from './FolderBox'

export class FolderBoxBody {
  private readonly referenceBox: FolderBox
  private boxes: Box[] = []

  public constructor(referenceBox: FolderBox) {
    this.referenceBox = referenceBox
  }

  public getId(): string {
    return this.referenceBox.getId() + 'body'
  }

  public async render(): Promise<void> {
    let html: string = '<div id="' + this.getId() + '"></div>'
    await dom.addContentTo(this.referenceBox.getId(), html)

    this.renderBoxes()
  }

  private async renderBoxes(): Promise<void> {
    fileSystem.readdirSync(this.referenceBox.getSrcPath()).forEach(file => { // TODO: use async
      let fileName: string = file.name
      let filePath: string = this.referenceBox.getSrcPath() + '/' + fileName

      if (file.isDirectory()) {
        util.logInfo('Box::render directory ' + filePath)
        this.boxes.push(this.createFolderBox(fileName))

      } else if (file.isFile()) {
        util.logInfo('Box::render file ' + filePath)
        this.boxes.push(this.createFileBox(fileName))

      } else {
        util.logError('Box::render ' + filePath + ' is neither file nor directory.')
      }
    });

    this.boxes.forEach(box => {
      box.render()
    });
  }

  private createFolderBox(name: string): FolderBox {
    const elementId: string = this.renderBoxPlaceholderAndReturnId(name)
    return new FolderBox(elementId, name, this.referenceBox)
  }

  private createFileBox(name: string): FileBox {
    const elementId: string = this.renderBoxPlaceholderAndReturnId(name)
    return new FileBox(elementId, name, this.referenceBox)
  }

  private renderBoxPlaceholderAndReturnId(name: string): string {
    const elementId: string = dom.generateElementId()
    dom.addContentTo(this.getId(), '<div id="' + elementId + '" style="display:inline-block;">loading... ' + name + '</div>')
    return elementId
  }

  public containsBox(box: Box): boolean {
    return this.boxes.includes(box)
  }

  public getBox(id: string): Box {
    return this.boxes[id.length] // TODO: real implementation
  }

  public addBox(box: Box): void {
    if (this.containsBox(box)) {
      util.logWarning('DirectoryBox.addBox: trying to add box that is already contained')
    }
    this.boxes.push(box)
    dom.appendChildTo(this.getId(), box.getId())
  }

  public removeBox(box: Box): void {
    if (!this.containsBox(box)) {
      util.logWarning('DirectoryBox.removeBox: trying to remove box that is not contained')
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
