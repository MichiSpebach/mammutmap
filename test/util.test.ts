import { util } from '../src/util'

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
