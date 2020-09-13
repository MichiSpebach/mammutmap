import * as fs from 'fs';
import * as util from './util'

export class Box {
  private path: string

  public constructor(directoryPath: string) {
    this.path = directoryPath
  }

  public visualizeDirectory(): void {
    util.log('visualizeDirectory')
    fs.readdirSync(this.path).forEach(file => {
      util.log(file);
      this.visualizeFile(this.path, file)
    });
  }

  private visualizeFile(directoryPath: string, fileName: string): void {
    let filePath: string = directoryPath + '/' + fileName;
    util.log("visualizeFile " + filePath)
    fs.readFile(filePath, 'utf-8', (err, data) => {
        if(err) {
          util.log('visualizeFile ' + filePath + ': interpret error as directory:' + err.message)
          util.addContent(this.formDirectory(fileName))
        } else {
          util.log('visualizeFile ' + filePath + ': file length of is ' + data.length)
          let fileContent: string = this.convertFileDataToHtmlString(data)
          util.addContent(this.formFile(fileName, fileContent))
        }
    })
  }

  private convertFileDataToHtmlString(fileData: string): string {
    var content: string = '';
    for (let i = 0; i < fileData.length-1; i++) {
      content += this.escapeCharForHtml(fileData[i])
    }
    return '<pre style="margin:0px">' + content + '</pre>'
  }

  private escapeCharForHtml(c: string): string {
    switch (c) {
      case '\n':
        return '<br/>'
      case '\'':
        return '&#39;'
      case '"':
        return '&quot;'
      case '<':
        return '&lt;'
      case '>':
        return '&gt;'
      case '&':
        return '&amp'
      default:
        return c
    }
  }

  public formDirectory(name: string): string {
    return '<div style="display:inline-block;border:dotted;border-color:skyblue">' + name + '</div>'
  }

  private formFile(name: string, content: string): string {
    return '<div style="display:inline-block">' + name + '<div style="border:solid;border-color:skyblue">' + content + '</div></div>'
  }
}
