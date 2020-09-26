import * as util from './util'
import { FileBox } from './FileBox'

export class Box {
  private path: string
  private id: string
  private widthInPercent: number
  private heightInPercent: number
  private boxes: FileBox[] = []

  public constructor(directoryPath: string, id: string) {
    this.path = directoryPath
    this.id = id
  }

  public getPath(): string {
    return this.path
  }

  public render(): void {
    util.logInfo('Box::render ' + this.path)
    util.readdirSync(this.path).forEach(file => {
      let fileName: string = file.name
      let filePath: string = this.path + '/' + fileName

      if (file.isDirectory()) {
        util.logInfo('Box::render directory ' + filePath)
        this.renderDirectory(fileName)

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

  private renderDirectory(name: string) {
    util.addContent('<div style="display:inline-block;border:dotted;border-color:skyblue;">' + name + '</div>')
  }

  private createFileBox(name: string): FileBox {
    let elementId: string = util.generateElementId()
    util.addContent('<div id="' + elementId + '" style="display:inline-block;">loading...' + name + '</div>')
    return new FileBox(this, name, elementId)
  }

}
