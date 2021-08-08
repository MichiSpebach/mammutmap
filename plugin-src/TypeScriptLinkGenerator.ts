import * as ts from 'typescript'
import { Program, SourceFile } from 'typescript'
import { MenuItem } from 'electron'
import * as util from '../dist/util'
import * as applicationMenu from '../dist/applicationMenu'
import * as pluginFacade from '../dist/pluginFacade'
import { FileBox } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Generate links', click: generateLinks}))
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Join on GitHub (coming soon)'}))

function generateLinks(): void {
  util.logInfo('generateLinks')

  pluginFacade.getFileBoxes().forEach((box: FileBox) => {
    const sourcePath: string = box.getSrcPath()
    if (sourcePath.endsWith('.ts')) {
      generateOutgoingLinksForFile(box.getSrcPath())
    }
  });

  util.logInfo('generateLinks finished')
}

function generateOutgoingLinksForFile(filePath: string) {
  const program: Program = ts.createProgram([filePath], {})

  const sourceFile: SourceFile|undefined = program.getSourceFile(filePath)
  if (!sourceFile) {
    util.logError('failed to get '+ filePath +' as SourceFile')
    return // TODO: compiler does not know that util.logError(..) returns never
  }

  ts.forEachChild(sourceFile, node => {
    if (ts.isImportDeclaration(node)) {
      util.logInfo(node.moduleSpecifier.getText(sourceFile))
    }
  })
}
