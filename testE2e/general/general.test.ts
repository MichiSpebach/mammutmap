import * as gui from '../guiAdapter'
import *  as e2eUtil from '../util/util'

afterAll(async () => {
  await gui.resetWindow()
})

test('title of app', async () => {
  const title: string = await gui.getTitle()
  expect(title).toBe('MammutMap')
})

test('snapshot empty window', async () => {
  await gui.resetWindow()
  const image = await gui.takeScreenshot()
  await e2eUtil.expectImageToMatchSnapshot({image})
})
