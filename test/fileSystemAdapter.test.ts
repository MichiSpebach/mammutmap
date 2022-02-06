import { fileSystem } from '../src/fileSystemAdapter'
import { JsonObject } from '../src/JsonObject'

test('doesDirentExist', async () => {
  expect(await fileSystem.doesDirentExist('src')).toBe(true)
  expect(await fileSystem.doesDirentExist('notExisting')).toBe(false)
})

test('mergeObjectIntoJsonFile', async () => {
  mockReadFile('{'
    + '"name": "box1",'
    + '"x": 1'
    + '}')
  const getSavedData: () => string = mockWriteFile().getSavedData

  await fileSystem.mergeObjectIntoJsonFile('path', new TestJsonObject({name: "box2", x: 3}))

  expect(getSavedData()).toBe('{\n'
    + '\t"name": "box2",\n'
    + '\t"x": 3\n'
    + '}')
})

test('mergeObjectIntoJsonFile partial', async () => {
  mockReadFile('{'
    + '"id": "box1",'
    + '"x": 1'
    + '}')
  const getSavedData: () => string = mockWriteFile().getSavedData

  await fileSystem.mergeObjectIntoJsonFile('path', new TestJsonObject({x: 2}))

  expect(getSavedData()).toBe('{\n'
    + '\t"id": "box1",\n'
    + '\t"x": 2\n'
    + '}')
})

test('mergeObjectIntoJsonFile additional', async () => {
  mockReadFile('{'
    + '"id": "box1"'
    + '}')
  const getSavedData: () => string = mockWriteFile().getSavedData

  await fileSystem.mergeObjectIntoJsonFile('path', new TestJsonObject({x: 2}))

  expect(getSavedData()).toBe('{\n'
    + '\t"id": "box1",\n'
    + '\t"x": 2\n'
    + '}')
})

test('mergeObjectIntoJsonFile deep', async () => {
  mockReadFile('{'
    + '"id": "box1",'
    + '"profile": {'
    + '"hash": "h4sH"'
    + '}'
    + '}')
  const getSavedData: () => string = mockWriteFile().getSavedData

  await fileSystem.mergeObjectIntoJsonFile('path', new TestJsonObject({profile: {loc: 123}}))

  expect(getSavedData()).toBe('{\n'
    + '\t"id": "box1",\n'
    + '\t"profile": {\n'
//    + '\t\t"hash": "h4sH",\n' // TODO: make this work, inner objects should be merged too
    + '\t\t"loc": 123\n'
    + '\t}\n'
    + '}')
})

test('mergeObjectIntoJsonFile undefined', async () => {
  mockReadFile('{'
    + '"id": "box1"'
    + '}')
  const getSavedData: () => string = mockWriteFile().getSavedData

  await fileSystem.mergeObjectIntoJsonFile('path', new TestJsonObject({x: undefined}))

  expect(getSavedData()).toBe('{\n'
    + '\t"id": "box1"\n'
    + '}')
})

function mockReadFile(returnData: string): void {
  fileSystem.readFile = (_: string): Promise<string> => {
    return Promise.resolve(returnData)
  }
}

function mockWriteFile(): {getSavedData: (() => string)} {
  let savedData: string
  fileSystem.writeFile = (_: string, data: string): Promise<void> => {
    savedData = data
    return Promise.resolve()
  }
  return {getSavedData: () => savedData}
}

class TestJsonObject extends JsonObject {
  public name: string|undefined
  public x: number|undefined
  public profile: {loc: number}|undefined

  constructor(fields: {name?: string, x?: number, profile?: {loc: number}}) {
    super()
    this.name = fields.name
    this.x = fields.x
    this.profile = fields.profile
  }
}
