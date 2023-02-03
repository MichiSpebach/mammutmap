import { util } from '../util'
import { fileSystem, Stats } from '../fileSystemAdapter'
import { renderManager } from '../RenderManager'
import { BoxBody } from './BoxBody'
import { FileBox } from './FileBox'
import { style } from '../styleAdapter'

export class FileBoxBody extends BoxBody {
  private readonly referenceFileBox: FileBox

  public constructor(referenceBox: FileBox) {
    super(referenceBox)
    this.referenceFileBox = referenceBox
  }

  private getContentId(): string {
    return this.getId()+'Content'
  }

  public async executeRender(): Promise<void> {
    if (this.isRendered()) {
      return
    }

    const normalizedFileName: string = this.referenceFileBox.getName().toLowerCase()
    try {
      // TODO: make something like this work: getImageType().startsWith('image/')
      if (normalizedFileName.endsWith('.png') || normalizedFileName.endsWith('.jpg') || normalizedFileName.endsWith('.svg')) {
        this.setContent(await this.formHtmlContentForImage())
      } else {
        this.setContent(await this.formHtmlContentForTextFile())
      }
    } catch(error: any) {
      this.setContent(this.formHtmlContentForError(error))
    }
  }

  private async setContent(content: string): Promise<void> {
    await renderManager.setContentTo(this.getId(), content)
  }

  protected async executeUnrenderIfPossible(): Promise<{anyChildStillRendered: boolean}> {
    if (!this.isRendered()) {
      return {anyChildStillRendered: false}
    }
    await renderManager.remove(this.getContentId())
    return {anyChildStillRendered: false}
  }

  private async formHtmlContentForImage(): Promise<string|never> {
    return `<img id="${this.getContentId()}" style="width:100%;" src="${util.escapeForHtml(this.referenceFileBox.getSrcPath())}">`
  }

  private async formHtmlContentForTextFile(): Promise<string|never> {
    const maxFileSizeInKiloBytes: number = 100 // TODO: add setting for this
    const fileStats: Stats = await fileSystem.getDirentStatsOrThrow(this.referenceFileBox.getSrcPath())
    if (fileStats.size/1000 > maxFileSizeInKiloBytes) {
      const tooLargeHint: string = 'File is too large to be displayed as textfile'
      const sizeHint: string = `(${fileStats.size/1000} kilobytes, maximum is ${maxFileSizeInKiloBytes} kilobytes)`
      const pluginHint: string = 'Install or write a plugin to display it.' // TODO: add hyperlink to plugin tutorial
      return this.formHtmlContentForError(`${tooLargeHint} ${sizeHint}.<br>${pluginHint}`)
    }

    const data: string = await this.getFileContent()
    const mostImportantLines: string = this.extractMostImportantLines(data, 20, 10)
    const dataConvertedToHtml: string = util.escapeForHtml(mostImportantLines)
    return `<pre id="${this.getContentId()}" class="${style.getFileBoxBodyTextClass()}">${dataConvertedToHtml}</pre>`
  }

  public getFileContent(): Promise<string> {
    return fileSystem.readFile(this.referenceFileBox.getSrcPath())
  }

  private extractMostImportantLines(code: string, roughNumberOfLines: number, minNumberOfLines: number): string {
    let mostImportantLines: string[] = []

    const lines = this.extractLines(code)
    for (let indentation = 0; indentation < 3 && mostImportantLines.length < roughNumberOfLines; indentation++) {
      const importantLines: string[] = this.extractLinesWithLowIndentation(lines, indentation)
      if (importantLines.length > minNumberOfLines || Math.abs(importantLines.length-roughNumberOfLines) < Math.abs(mostImportantLines.length-roughNumberOfLines)) {
        mostImportantLines = importantLines
      }
    }

    return mostImportantLines.reduce((lines: string, line: string) => lines+line, '')
  }

  private extractLines(code: string): string[] {
    const lines: string[] = []

    let startLineIndex: number = 0
    for (let index: number = 0; index < code.length; index++) {
      const char: string = code[index]
      if (char === '\n' || index === code.length-1) {
        lines.push(code.substring(startLineIndex, index+1))
        startLineIndex = index+1
      }
    }

    return lines
  }

  private extractLinesWithLowIndentation(lines: string[], maxIndentationDepth: number): string[] {
    let mostImportantLines: string[] = []

    let latestImportantLine: string|undefined = undefined
    for (const line of lines) {
      if (util.consistsOnlyOfEmptySpace(line)) {
        if (!latestImportantLine) {
          continue
        } else if (util.consistsOnlyOfEmptySpace(latestImportantLine)) {
          continue
        }
      } else if (util.getIndentationDepth(line) > maxIndentationDepth) {
        continue
      }
      if (line.startsWith('import')) {
        continue
      }
      if (util.consistsOnlyOfEmptySpaceExcept(line, '}')) {
        if (latestImportantLine && util.consistsOnlyOfEmptySpace(latestImportantLine)) {
          mostImportantLines.pop()
          latestImportantLine = mostImportantLines[mostImportantLines.length-1]
        }
        if (latestImportantLine && latestImportantLine.match(/{\s*$/)) {
          mostImportantLines[mostImportantLines.length-1] = latestImportantLine.replace(/{\s*$/, '\n')
          continue
        }
      }
      latestImportantLine = line
      mostImportantLines.push(line)
    }

    return mostImportantLines
  }

  private formHtmlContentForError(errorMessage: string): string {
    return `<div id="${this.getContentId()}" class="${style.getFileBoxBodyTextClass()}" style="color:red;">${errorMessage}</div>`
  }

}
