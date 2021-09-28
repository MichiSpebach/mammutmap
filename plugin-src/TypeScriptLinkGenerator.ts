import * as ts from 'typescript'
import { Program, SourceFile } from 'typescript'
import { MenuItem } from 'electron'
import * as util from '../dist/util'
import * as applicationMenu from '../dist/applicationMenu'
import * as pluginFacade from '../dist/pluginFacade'
import { Box, FileBoxDepthTreeIterator } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Generate links', click: generateLinks}))
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItem({label: 'Join on GitHub (coming soon)'}))

async function generateLinks(): Promise<void> {
  util.logInfo('generateLinks')

  const boxes: FileBoxDepthTreeIterator = pluginFacade.getFileBoxIterator()
  while (boxes.hasNext()) {
    const box = boxes.next()
    const sourcePath: string = box.getSrcPath()
    if (sourcePath.endsWith('.ts')) {
      await generateOutgoingLinksForBox(box)
    }
  }

  util.logInfo('generateLinks finished')
}

async function generateOutgoingLinksForBox(box: Box): Promise<void> {
  const filePath: string = box.getSrcPath()
  util.logInfo('generate outgoing links for file '+filePath)

  await util.wait(0) // unblocks main-thread // TODO: still blocks too much, use workers and run in other thread
  const program: Program = ts.createProgram([filePath], {}) // TODO: try createProgram with multiple files, could save magnitude of time
  const sourceFile: SourceFile|undefined = program.getSourceFile(filePath)
  if (!sourceFile) {
    util.logError('failed to get '+ filePath +' as SourceFile')
    return // TODO: compiler does not know that util.logError(..) returns never
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
    const normalizedToFilePath = normalizePath(parentFilePath+'/'+normalizedImportPath)
    await pluginFacade.addLink(fromFilePath, normalizedToFilePath)
  }
}

function isImportFromLibrary(importPath: string): boolean {
  return !importPath.includes('/')
}

function normalizePath(path: string): string {
  return path.replaceAll(new RegExp('/[^/]+/(..)/', 'g'), '/')
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
