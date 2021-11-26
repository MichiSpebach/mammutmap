import * as gui from '../guiAdapter'
import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'

expect.extend({ toMatchImageSnapshot })
const snapshotOptions: MatchImageSnapshotOptions = {customSnapshotsDir: __dirname, customDiffDir: __dirname}

afterAll(async () => {
  await gui.resetWindow()
})

test('file with special characters', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/renderFiles/scenario')
  const image = await gui.takeScreenshot()
  expect(image).toMatchImageSnapshot(snapshotOptions)
})
