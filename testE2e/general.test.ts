import * as gui from './guiAdapter'

beforeAll(async () => {
  await gui.ensureInit()
}, 25000)

afterAll(async () => {
  await gui.shutdown()
})

test('title of app', async () => {
  const title: string = await gui.getTitle()
  expect(title).toBe('FileVis')
})
