import * as util from './util'
import { FileBox } from './FileBox'

export class Box {
  private path: string
  private id: string
  private targetWidth: number
  private targetHeight: number

  public constructor(directoryPath: string) {
    this.path = directoryPath
  }

  public getPath(): string {
    return this.path
  }

  public visualize(): void {
    util.logInfo('Box::visualize ' + this.path)
    util.readdirSync(this.path).forEach(file => {
      let fileName: string = file.name
      let filePath: string = this.path + '/' + fileName

      if (file.isDirectory()) {
        util.logInfo('Box::visualize directory ' + filePath)
        this.visualizeDirectory(fileName)

      } else if (file.isFile()) {
        util.logInfo('Box::visualize file ' + filePath)
        this.visualizeFile(fileName)

      } else {
        util.logError('Box::visualize ' + filePath + ' is neither file nor directory.')
      }
    });
  }

  private visualizeDirectory(name: string) {
    util.addContent('<div style="display:inline-block;border:dotted;border-color:skyblue">' + name + '</div>')
  }

  private visualizeFile(name: string): void {
    let boxId: string = util.generateDivId()
    util.addContent('<div id="' + boxId + '" style="display:inline-block">' + name + '</div>')
    let box: FileBox = new FileBox(this, name, boxId)
    box.render()
  }

}
