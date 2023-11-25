import * as ts from 'typescript'
import { Program, SourceFile } from 'typescript'
import { applicationMenu, contextMenu, MenuItemFile } from '../dist/pluginFacade'
import { coreUtil } from '../dist/pluginFacade'
import * as pluginFacade from '../dist/pluginFacade'
import { FileBox, FileBoxDepthTreeIterator } from '../dist/pluginFacade'

applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItemFile({label: 'Generate links', click: generateLinks}))
applicationMenu.addMenuItemTo('TypeScriptLinkGenerator.js', new MenuItemFile({label: 'Join on GitHub (coming soon)', click: () => coreUtil.logInfo('Join on GitHub is coming soon')}))

contextMenu.addFileBoxMenuItem((box: pluginFacade.FileBox) => {
  if (!box.getName().endsWith('.ts')) {
    return undefined
  }
  return new MenuItemFile({label: 'generate outgoing ts links', click: async () => {
    await generateOutgoingLinksForBoxes([box])
  }})
})

async function generateLinks(): Promise<void> {
  coreUtil.logInfo('generateLinks')

  const boxes: FileBoxDepthTreeIterator = pluginFacade.getFileBoxIterator()
  let boxChunk: FileBox[] = [] // calling ts.createProgram(..) with many files is magnitude faster than calling many times with one file
  while (await boxes.hasNextOrUnwatch()) {
    const box = await boxes.next()
    if (box.getSrcPath().endsWith('.ts')) {
      boxChunk.push(box)
    }
    if (boxChunk.length > 31) {
      await generateOutgoingLinksForBoxes(boxChunk)
      boxChunk = []
    }
  }

  coreUtil.logInfo('generateLinks finished')
}

async function generateOutgoingLinksForBoxes(boxes: FileBox[]) {
  const filePaths: string[] = boxes.map(box => box.getSrcPath())
  const program: Program = ts.createProgram(filePaths, {}) // TODO: blocks for about a second, use workers and run in other thread

  for (const box of boxes) {
    await generateOutgoingLinksForBox(box, program)
  }
}

async function generateOutgoingLinksForBox(box: FileBox, program: Program): Promise<void> {
  const filePath: string = box.getSrcPath()
  coreUtil.logInfo('generate outgoing links for file '+filePath)

  const sourceFile: SourceFile|undefined = program.getSourceFile(filePath)
  if (!sourceFile) {
    coreUtil.logError('failed to get '+ filePath +' as SourceFile')
  }

  const importPaths: string[] = extractImportPaths(sourceFile)
  await addLinks(box, importPaths)
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

async function addLinks(fromBox: FileBox, relativeToFilePaths: string[]): Promise<void> {
  let foundLinksCount: number = 0
  let foundLinksAlreadyExistedCount: number = 0

  for (let relativeToFilePath of relativeToFilePaths) {
    if (isImportFromLibrary(relativeToFilePath)) {
      continue
    }
    const normalizedRelativeToFilePath: string = normalizeRelativeImportPath(relativeToFilePath)
    const report = await pluginFacade.addLink(fromBox, normalizedRelativeToFilePath, {delayUnwatchingOfBoxesInMS: 500})

    foundLinksCount += report.linkRoute ? 1 : 0
    foundLinksAlreadyExistedCount += report.linkRouteAlreadyExisted ? 1 : 0
  }

  coreUtil.logInfo(`Found ${foundLinksCount} links for '${fromBox.getName()}', ${foundLinksAlreadyExistedCount} of them already existed.`)
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
