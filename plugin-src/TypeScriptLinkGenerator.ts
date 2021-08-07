import * as ts from 'typescript'
import { Program, SourceFile } from 'typescript'
import { MenuItem } from 'electron'
import * as util from '../dist/util'
import * as applicationMenu from '../dist/applicationMenu'

applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Generate links', click: generateLinks}))
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Join on GitHub (coming soon)'}))

function generateLinks(): void {
  util.logInfo('generateLinks')

  const rootFilePath: string = 'src/index.ts'
  const program: Program = ts.createProgram([rootFilePath], {})

  const sourceFile: SourceFile|undefined = program.getSourceFile(rootFilePath)
  if (!sourceFile) {
    util.logError('failed to get '+ rootFilePath +' as SourceFile')
    return // TODO: compiler does not know that util.logError(..) returns never
  }

  ts.forEachChild(sourceFile, node => {
    if (ts.isImportDeclaration(node)) {
      util.logInfo(node.moduleSpecifier.getText(sourceFile))
    }
  })

  util.logInfo('generateLinks finished')
}
