import * as gui from '../guiAdapter'
import { util } from '../../src/util'
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
  await util.wait(50) // TODO: otherwise htmlCursor has somehow a shadow => some pixel differ from snapshot and test fails, fix this
  const image = await gui.takeScreenshot()
  e2eUtil.expectImageToMatchSnapshot({image})
})
