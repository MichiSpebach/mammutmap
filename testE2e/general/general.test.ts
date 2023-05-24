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

test('unhandled errors are logged and visible', async () => {
  await gui.resetWindow()
  await gui.runInMainThread(`() => {throw new Error('unhandled errors are logged and visible')}`)
  await gui.waitUntilLogsEqual(['ERROR: unhandled errors are logged and visible'], 50)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'unhandled-errors'})
})