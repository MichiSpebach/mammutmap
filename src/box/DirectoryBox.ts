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
    }

    return 'border:dotted;border-color:skyblue;' + backgroundStyle
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

    /*dom.addDragEnterListenerTo(super.getId(), 'dragenter', super.getId()+'header', () => {
      this.dragOver = true
      super.renderStyle()
    })
    dom.addDragEnterListenerTo(super.getId(), 'dragleave', super.getId()+'header', () => {
      this.dragOver = false
      super.renderStyle()
    })*/
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

  public dragEnter(box: Box): void {
    this.dragOver = true
    super.renderStyle()
    // TODO: if box already contained return here
    this.boxes.push(box)
    dom.appendChildTo(super.getId(), box.getId())

    // TODO: wip
    //box.getParent().boxes.remove(box) // TODO: has to be done with splice
    //box.getParent().dragOver = false
    //box.getParent().renderStyle()
  }

  public dragLeave(box: Box): void {
    // TODO: call from child?
  }

}
