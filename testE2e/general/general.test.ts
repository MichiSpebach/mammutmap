import * as gui from '../guiAdapter'
import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'
import { util } from '../../src/util'

expect.extend({ toMatchImageSnapshot })
const snapshotOptions: MatchImageSnapshotOptions = {customSnapshotsDir: __dirname, customDiffDir: __dirname}

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
  expect(image).toMatchImageSnapshot(snapshotOptions)
})
