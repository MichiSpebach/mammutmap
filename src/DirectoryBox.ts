import * as util from './util'
import * as dom from './domAdapter'
import { Box } from './Box'
import { Path } from './Path'
import { FileBox } from './FileBox'

export class DirectoryBox extends Box {
  private boxes: Box[] = []

  public constructor(path: Path, id: string) {
    super(path, id)
  }

  protected getBorderStyle(): string {
    return 'border:dotted;border-color:skyblue;'
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
    return new DirectoryBox(Path.buildDirEntry(super.getPath(), name), elementId)
  }

  private createFileBox(name: string): FileBox {
    let elementId: string = this.renderBoxPlaceholderAndReturnId(name)
    return new FileBox(Path.buildDirEntry(super.getPath(), name), elementId)
  }

  private renderBoxPlaceholderAndReturnId(name: string): string {
    let elementId: string = dom.generateElementId()
    dom.addContentTo(super.getId(), '<div id="' + elementId + '" style="display:inline-block;">loading... ' + name + '</div>')
    return elementId
  }

}
