import * as ts from 'typescript'
import { Program, SourceFile } from 'typescript'
import { MenuItem } from 'electron'
import * as util from '../dist/util'
import * as applicationMenu from '../dist/applicationMenu'
import * as pluginFacade from '../dist/pluginFacade'
import { Box, FileBoxIterator } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Generate links', click: generateLinks}))
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Join on GitHub (coming soon)'}))

function generateLinks(): void {
  util.logInfo('generateLinks')

  const boxes: FileBoxIterator = pluginFacade.getFileBoxIterator()
  while (boxes.hasNext()) {
    const box = boxes.next()
    const sourcePath: string = box.getSrcPath()
    if (sourcePath.endsWith('.ts')) {
      generateOutgoingLinksForBox(box)
    }
  }

  util.logInfo('generateLinks finished')
}

function generateOutgoingLinksForBox(box: Box) {
  const filePath: string = box.getSrcPath()
  util.logInfo('generate outgoing links for file '+filePath)

  const program: Program = ts.createProgram([filePath], {})
  const sourceFile: SourceFile|undefined = program.getSourceFile(filePath)
  if (!sourceFile) {
    util.logError('failed to get '+ filePath +' as SourceFile')
    return // TODO: compiler does not know that util.logError(..) returns never
  }

  const parentFilePath: string = box.getParent().getSrcPath()
  ts.forEachChild(sourceFile, node => {
    if (ts.isImportDeclaration(node)) {
      let relativeToPath: string = node.moduleSpecifier.getText(sourceFile)
      relativeToPath = normalizeRelativeImportPath(relativeToPath)
      pluginFacade.addLink(filePath, parentFilePath+'/'+relativeToPath)
    }
  })
}

function normalizeRelativeImportPath(path: string): string {
  path = path.replaceAll('\'', '')
  path = path.replaceAll('"', '')
  if (!path.endsWith('.ts')) {
    path += '.ts'
  }
  if (path.startsWith('./')) {
    path = path.substring(2)
  }
  return path
}
