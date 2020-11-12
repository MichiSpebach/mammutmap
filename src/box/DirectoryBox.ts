import * as util from '../util'
import * as dom from '../domAdapter'
import { Box } from './Box'
import { FileBox } from './FileBox'
import { Path } from '../Path'

export class DirectoryBox extends Box {
  private boxes: Box[] = []
  private dragOver: boolean = false

  public constructor(path: Path, id: string, parent: DirectoryBox|null) {
    super(path, id, parent)
  }

  protected getOverflow(): 'visible' {
    return 'visible'
  }

  protected getBorderStyle(): string {
    var backgroundStyle: string = '' // TODO: move to better place
    if (this.dragOver) {
      backgroundStyle = 'background-color:#0000FF88'
    } else {
      backgroundStyle = 'background-color:#00000000'
    }

    return 'border:dotted;border-color:skyblue;' + backgroundStyle
  }

  public setDragOverStyle(value: boolean) {
    this.dragOver = value
    super.renderStyle()
  }

  protected renderBody(): void {
    util.readdirSync(super.getPath().getSrcPath()).forEach(file => {
      let fileName: string = file.name
      let filePath: string = super.getPath().getSrcPath() + '/' + fileName

      if (file.isDirectory()) {
        util.logInfo('Box::render directory ' + filePath)
        this.boxes.push(this.createDirectoryBox(fileName))

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

  private createDirectoryBox(name: string): DirectoryBox {
    let elementId: string = this.renderBoxPlaceholderAndReturnId(name)
    return new DirectoryBox(Path.buildDirEntry(super.getPath(), name), elementId, this)
  }

  private createFileBox(name: string): FileBox {
    let elementId: string = this.renderBoxPlaceholderAndReturnId(name)
    return new FileBox(Path.buildDirEntry(super.getPath(), name), elementId, this)
  }

  private renderBoxPlaceholderAndReturnId(name: string): string {
    let elementId: string = dom.generateElementId()
    dom.addContentTo(super.getId(), '<div id="' + elementId + '" style="display:inline-block;">loading... ' + name + '</div>')
    return elementId
  }

  private containsBox(box: Box): boolean {
    return this.boxes.includes(box)
  }

  public addBox(box: Box): void {
    if (this.containsBox(box)) {
      util.logWarning('DirectoryBox.addBox: trying to add box that is already contained')
    }
    this.boxes.push(box)
    dom.appendChildTo(super.getId(), box.getId())
  }

  public removeBox(box: Box): void {
    if (!this.containsBox(box)) {
      util.logWarning('DirectoryBox.removeBox: trying to remove box that is not contained')
    }
    this.boxes.splice(this.boxes.indexOf(box), 1)
    // TODO: try to remove from dom?
  }

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
