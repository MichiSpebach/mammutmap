import * as ts from 'typescript'
import { Program, SourceFile } from 'typescript'
import { MenuItem } from 'electron'
import { util } from '../dist/util'
import * as applicationMenu from '../dist/applicationMenu'
import * as contextMenu from '../dist/contextMenu'
import * as pluginFacade from '../dist/pluginFacade'
import { Box, FileBoxDepthTreeIterator } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Generate links', click: generateLinks}))
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Join on GitHub (coming soon)'}))

contextMenu.addFileBoxMenuItem((box: pluginFacade.FileBox) => {
  if (!box.getName().endsWith('.ts')) {
    return undefined
  }
  return {label: 'generate outgoing links', action: () => generateOutgoingLinksForBoxes([box])}
})

async function generateLinks(): Promise<void> {
  util.logInfo('generateLinks')

  const boxes: FileBoxDepthTreeIterator = pluginFacade.getFileBoxIterator()
  let boxChunk: Box[] = [] // calling ts.createProgram(..) with many files is magnitude faster than calling many times with one file
  while (await boxes.hasNext()) {
    const box = await boxes.next()
    if (box.getSrcPath().endsWith('.ts')) {
      boxChunk.push(box)
    }
    if (boxChunk.length > 31) {
      await generateOutgoingLinksForBoxes(boxChunk)
      boxChunk = []
    }
  }

  util.logInfo('generateLinks finished')
}

async function generateOutgoingLinksForBoxes(boxes: Box[]) {
  const filePaths: string[] = boxes.map(box => box.getSrcPath())
  const program: Program = ts.createProgram(filePaths, {}) // TODO: blocks for about a second, use workers and run in other thread

  for (const box of boxes) {
    await generateOutgoingLinksForBox(box, program)
  }
}

async function generateOutgoingLinksForBox(box: Box, program: Program): Promise<void> {
  const filePath: string = box.getSrcPath()
  util.logInfo('generate outgoing links for file '+filePath)

  const sourceFile: SourceFile|undefined = program.getSourceFile(filePath)
  if (!sourceFile) {
    util.logError('failed to get '+ filePath +' as SourceFile')
  }

  const parentFilePath: string = box.getParent().getSrcPath()
  const importPaths: string[] = extractImportPaths(sourceFile)
  await addLinks(filePath, parentFilePath, importPaths)
}

function extractImportPaths(sourceFile: SourceFile): string[] {
  const importPaths: string[] = []

  ts.forEachChild(sourceFile, node => {
    if (ts.isImportDeclaration(node)) {
      let importPath: string = node.moduleSpecifier.getText(sourceFile)
      importPaths.push(importPath)
    }
  })

  return importPaths
}

async function addLinks(fromFilePath: string, parentFilePath: string, relativeToFilePaths: string[]): Promise<void> {
  for (let importPath of relativeToFilePaths) {
    if (isImportFromLibrary(importPath)) {
      continue
    }
    const normalizedImportPath = normalizeRelativeImportPath(importPath)
    const normalizedToFilePath = util.concatPaths(parentFilePath, normalizedImportPath)
    await pluginFacade.addLink(fromFilePath, normalizedToFilePath)
  }
}

function isImportFromLibrary(importPath: string): boolean {
  return !importPath.includes('/')
}

function normalizeRelativeImportPath(path: string): string {
  path = path.replaceAll('\'', '')
  path = path.replaceAll('"', '')
  if (!path.endsWith('.ts')) {
    path += '.ts'
  }
  return path
}
