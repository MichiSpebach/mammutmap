import { util } from '../../src/core/util/util'

test('getIndentationDepth', () => {
  expect(util.getIndentationDepth('')).toBe(0)
  expect(util.getIndentationDepth('a')).toBe(0)
  expect(util.getIndentationDepth(' ', 2)).toBe(0)
  expect(util.getIndentationDepth('  ', 2)).toBe(1)
  expect(util.getIndentationDepth('  a', 2)).toBe(1)
  expect(util.getIndentationDepth('\t')).toBe(1)
  expect(util.getIndentationDepth('\ta')).toBe(1)
  expect(util.getIndentationDepth('    a', 2)).toBe(2)
  expect(util.getIndentationDepth('\t\ta', 2)).toBe(2)
  expect(util.getIndentationDepth('test\ttest', 2)).toBe(0)
  expect(util.getIndentationDepth('\ttest\ttest', 2)).toBe(1)
})

test('consistsOnlyOfEmptySpace', () => {
  expect(util.consistsOnlyOfEmptySpace('')).toBe(true)
  expect(util.consistsOnlyOfEmptySpace('\n')).toBe(true)
  expect(util.consistsOnlyOfEmptySpace('\n\r')).toBe(true)
  expect(util.consistsOnlyOfEmptySpace(' ')).toBe(true)
  expect(util.consistsOnlyOfEmptySpace('\t')).toBe(true)
  expect(util.consistsOnlyOfEmptySpace(' \n')).toBe(true)
  expect(util.consistsOnlyOfEmptySpace('\t\n')).toBe(true)
  expect(util.consistsOnlyOfEmptySpace('\n ')).toBe(true)

  expect(util.consistsOnlyOfEmptySpace('a')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('a ')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('a\n')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('a ')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('a\t')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace(' a ')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('\ta\t')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('.')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace(';')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('-')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('}')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('?')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('`')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('\'')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('"')).toBe(false)
  expect(util.consistsOnlyOfEmptySpace('0')).toBe(false)
})

test('consistsOnlyOfEmptySpaceExcept', () => {
  expect(util.consistsOnlyOfEmptySpaceExcept('}', '}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept(' }', '}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('\t}', '}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('  }', '}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('\t\t}', '}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('} ', '}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('}\t', '}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('}\n', '}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('\t}\n', '}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('\t}\n ', '}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('\t}\t\n', '}')).toBe(true)

  expect(util.consistsOnlyOfEmptySpaceExcept('', '}')).toBe(false)
  expect(util.consistsOnlyOfEmptySpaceExcept(' ', '}')).toBe(false)
  expect(util.consistsOnlyOfEmptySpaceExcept('a', '}')).toBe(false)
  expect(util.consistsOnlyOfEmptySpaceExcept('a}', '}')).toBe(false)
  expect(util.consistsOnlyOfEmptySpaceExcept('}a', '}')).toBe(false)
  expect(util.consistsOnlyOfEmptySpaceExcept('} a', '}')).toBe(false)
  expect(util.consistsOnlyOfEmptySpaceExcept(' a ', '}')).toBe(false)
  expect(util.consistsOnlyOfEmptySpaceExcept('\t} a ', '}')).toBe(false)

  expect(util.consistsOnlyOfEmptySpaceExcept('text', 'text')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept(' text', 'text')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('\ttext', 'text')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('text\n', 'text')).toBe(true)

  expect(util.consistsOnlyOfEmptySpaceExcept('Text', 'text')).toBe(false)
  expect(util.consistsOnlyOfEmptySpaceExcept('t', 'text')).toBe(false)
  expect(util.consistsOnlyOfEmptySpaceExcept('texts', 'text')).toBe(false)

  expect(util.consistsOnlyOfEmptySpaceExcept('{}', '{}')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('', '{}')).toBe(false)

  expect(util.consistsOnlyOfEmptySpaceExcept('()', '()')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('', '()')).toBe(false)

  expect(util.consistsOnlyOfEmptySpaceExcept('[a]', '[a]')).toBe(true)
  expect(util.consistsOnlyOfEmptySpaceExcept('a', '[a]')).toBe(false)
})

test('joinPaths', () => {
  expect(util.joinPaths(['projectFolder', 'src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder', '/src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder/', 'src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder/', '/src'])).toBe('projectFolder/src')

  expect(util.joinPaths(['projectFolder/map', '../src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder/map/', '../src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['/root/projectFolder/map', '../src'])).toBe('/root/projectFolder/src')

  expect(util.joinPaths(['../', 'src'])).toBe('../src')
  expect(util.joinPaths(['projectFolder/map', '../', 'src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder/map', '../', '/src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder/map/', '../', 'src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder/map/', '../', '/src'])).toBe('projectFolder/src')

  expect(util.joinPaths(['./', 'file.json'])).toBe('./file.json')
  expect(util.joinPaths(['projectFolder/map', './file.json'])).toBe('projectFolder/map/file.json')
  expect(util.joinPaths(['projectFolder/map/', './file.json'])).toBe('projectFolder/map/file.json')

  expect(util.joinPaths(['projectFolder/map', './', 'file.json'])).toBe('projectFolder/map/file.json')
  expect(util.joinPaths(['projectFolder/map', './', '/file.json'])).toBe('projectFolder/map/file.json')
  expect(util.joinPaths(['projectFolder/map/', './', 'file.json'])).toBe('projectFolder/map/file.json')
  expect(util.joinPaths(['projectFolder/map/', './', '/file.json'])).toBe('projectFolder/map/file.json')
})

test('joinPaths backslashes instead of slashes', () => {
  expect(util.joinPaths(['projectFolder', 'src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder', '\\src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder\\', 'src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder\\', '\\src'])).toBe('projectFolder/src')

  expect(util.joinPaths(['projectFolder\\map', '..\\src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder\\map\\', '..\\src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['\\root\\projectFolder\\map', '..\\src'])).toBe('/root/projectFolder/src')

  expect(util.joinPaths(['..\\', 'src'])).toBe('../src')
  expect(util.joinPaths(['projectFolder\\map', '..\\', 'src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder\\map', '..\\', '\\src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder\\map\\', '..\\', 'src'])).toBe('projectFolder/src')
  expect(util.joinPaths(['projectFolder\\map\\', '..\\', '\\src'])).toBe('projectFolder/src')

  expect(util.joinPaths(['.\\', 'file.json'])).toBe('./file.json')
  expect(util.joinPaths(['projectFolder\\map', '.\\file.json'])).toBe('projectFolder/map/file.json')
  expect(util.joinPaths(['projectFolder\\map\\', '.\\file.json'])).toBe('projectFolder/map/file.json')

  expect(util.joinPaths(['projectFolder\\map', '.\\', 'file.json'])).toBe('projectFolder/map/file.json')
  expect(util.joinPaths(['projectFolder\\map', '.\\', '\\file.json'])).toBe('projectFolder/map/file.json')
  expect(util.joinPaths(['projectFolder\\map\\', '.\\', 'file.json'])).toBe('projectFolder/map/file.json')
  expect(util.joinPaths(['projectFolder\\map\\', '.\\', '\\file.json'])).toBe('projectFolder/map/file.json')
})

test('concatPaths', () => {
  expect(util.concatPaths('projectFolder/path/to/file', '../../../relative/import')).toBe('projectFolder/relative/import')
})

test('getElementCountOfPath', () => {
  expect(util.getElementCountOfPath('oneElement')).toBe(1)
  expect(util.getElementCountOfPath('oneElement.fileEnding')).toBe(1)
  expect(util.getElementCountOfPath('oneElement/')).toBe(1)
  
  expect(util.getElementCountOfPath('two/elements')).toBe(2)
  expect(util.getElementCountOfPath('two/elements.fileEnding')).toBe(2)
  expect(util.getElementCountOfPath('two/elements/')).toBe(2)
  
  expect(util.getElementCountOfPath('/')).toBe(1)
  expect(util.getElementCountOfPath('file://absolute/path')).toBe(2)
  expect(util.getElementCountOfPath('/absolute/path')).toBe(2)
  
  expect(util.getElementCountOfPath('./')).toBe(1)
  expect(util.getElementCountOfPath('./relative/path')).toBe(2)
  expect(util.getElementCountOfPath('../relative/path')).toBe(3)
})

test('matchFileNames', () => {
  expect(util.matchFileNames('fileName', 'otherFileName')).toBe(false)
  expect(util.matchFileNames('fileName', 'fileName')).toBe(true)
  expect(util.matchFileNames('fileName', 'fileName.fileEnding')).toBe(false)
  expect(util.matchFileNames('fileName.fileEnding', 'fileName')).toBe(false)

  expect(util.matchFileNames('fileName.fileEnding', 'fileName.fileEnding', {ignoreFileEndings: true})).toBe(true)
  expect(util.matchFileNames('fileName', 'fileName.fileEnding', {ignoreFileEndings: true})).toBe(true)
  expect(util.matchFileNames('fileName.fileEnding', 'fileName', {ignoreFileEndings: true})).toBe(true)
  expect(util.matchFileNames('fileName.fileEnding', 'fileName.otherFileEnding', {ignoreFileEndings: true})).toBe(true)
  expect(util.matchFileNames('fileName', 'fileName.file.endings', {ignoreFileEndings: true})).toBe(false)
  expect(util.matchFileNames('fileName.file.endings', 'fileName', {ignoreFileEndings: true})).toBe(false)
  expect(util.matchFileNames('fileName.component', 'fileName.component.tsx', {ignoreFileEndings: true})).toBe(true)
  expect(util.matchFileNames('fileName.component.tsx', 'fileName.component', {ignoreFileEndings: true})).toBe(true)
})
