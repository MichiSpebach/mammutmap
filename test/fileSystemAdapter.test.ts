import { fileSystem } from '../src/fileSystemAdapter'

test('doesDirentExist', async () => {
  expect(await fileSystem.doesDirentExist('src')).toBe(true)
  expect(await fileSystem.doesDirentExist('notExisting')).toBe(false)
})
