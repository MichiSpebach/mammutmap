import * as util from './util'
import { Box } from './Box'
import { FileBox } from './FileBox'

export class DirectoryBox extends Box {
  private boxes: Box[] = []

  public constructor(parent: Box|null, name: string, id: string) {
    super(parent, name, id)
  }

  protected getBorderStyle(): string {
    return 'border:dotted;border-color:skyblue;'
  }

  protected renderBody(): void {
    util.readdirSync(super.getPath()).forEach(file => {
      let fileName: string = file.name
      let filePath: string = super.getPath() + '/' + fileName

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
      box.render(49, 2*80 / this.boxes.length)
    });
  }

  private createDirectoryBox(name: string): DirectoryBox {
    let elementId: string = this.renderBoxPlaceholderAndReturnId(name)
    return new DirectoryBox(this, name, elementId)
  }

  private createFileBox(name: string): FileBox {
    let elementId: string = this.renderBoxPlaceholderAndReturnId(name)
    return new FileBox(this, name, elementId)
  }

  private renderBoxPlaceholderAndReturnId(name: string): string {
    let elementId: string = util.generateElementId()
    util.addContentTo(super.getId(), '<div id="' + elementId + '" style="display:inline-block;">loading... ' + name + '</div>')
    return elementId
  }

}
