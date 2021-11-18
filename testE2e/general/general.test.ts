import * as gui from '../guiAdapter'
import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'

expect.extend({ toMatchImageSnapshot })
const snapshotOptions: MatchImageSnapshotOptions = {customSnapshotsDir: __dirname, customDiffDir: __dirname}

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

test('snapshot after start', async () => {
  const image = await gui.takeScreenshot()
  expect(image).toMatchImageSnapshot(snapshotOptions)
})
