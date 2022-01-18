import { fileSystem } from '../src/fileSystemAdapter'

test('doesDirentExist', async () => {
  expect(await fileSystem.doesDirentExist('src')).toBe(true)
  expect(await fileSystem.doesDirentExist('notExisting')).toBe(false)
})

test('mergeObjectIntoJsonFile', async () => {
  let originalJson: string = '{'
    + '"name": "box1",'
    + '"x": 1'
    + '}'
  fileSystem.readFile = (path: string): Promise<string> => {
    return Promise.resolve(originalJson)
  }
  let savedJson: string = ''
  fileSystem.writeFile = (path: string, data: string): Promise<void> => {
    savedJson = data
    return Promise.resolve()
  }

  let object: Object = {name: "box2", x: 3}

  await fileSystem.mergeObjectIntoJsonFile('path', object)

  expect(savedJson).toBe('{\n'
    + '\t"name": "box2",\n'
    + '\t"x": 3\n'
    + '}')
})
