import * as util from './util'

export class Box {
  private path: string

  public constructor(directoryPath: string) {
    this.path = directoryPath
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
    util.addContent(this.formDirectoryBox(name))
  }

  private visualizeFile(name: string): void {
    let filePath: string = this.path + '/' + name;
    util.readFile(filePath, (dataConvertedToHtml: string) => {
      util.addContent(this.formFileBox(name, dataConvertedToHtml))
    })
  }

  private formDirectoryBox(name: string): string {
    return '<div style="display:inline-block;border:dotted;border-color:skyblue">' + name + '</div>'
  }

  private formFileBox(name: string, content: string): string {
    let preformattedContent: string = '<pre style="margin:0px">' + content + '</pre>'
    let contentDivision: string = '<div style="border:solid;border-color:skyblue">' + preformattedContent + '</div>'
    return '<div style="display:inline-block">' + name + contentDivision + '</div>'
  }
}
