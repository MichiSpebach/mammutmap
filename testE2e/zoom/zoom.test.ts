import * as gui from '../guiAdapter'
import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'

expect.extend({ toMatchImageSnapshot })
const snapshotOptions: MatchImageSnapshotOptions = {customSnapshotsDir: __dirname, customDiffDir: __dirname}

afterAll(async () => {
  await gui.resetWindow()
})

test('zoom into deep folder', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await gui.zoom(5000)
  const image = await gui.takeScreenshot()
  expect(image).toMatchImageSnapshot(snapshotOptions)
})
