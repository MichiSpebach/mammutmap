import * as gui from '../guiAdapter'
import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'

expect.extend({ toMatchImageSnapshot })
const snapshotOptions: MatchImageSnapshotOptions = {customSnapshotsDir: __dirname, customDiffDir: __dirname}

afterAll(async () => {
  await gui.resetWindow()
})

test('iterate over boxes', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/boxIterator/scenario')
  await gui.startBoxIterator()

  await gui.getNextSourcePathOfBoxIterator()
  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)

  await iterateOverBoxesUntilFile('testE2e/boxIterator/scenario/c/a/a')
  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)

  await iterateOverBoxesUntilFile('testE2e/boxIterator/scenario/b/a/a')
  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)

  expect(await gui.getNextSourcePathOfBoxIterator()).toBeUndefined()
  await gui.clearWatchedBoxes()
  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)
})

async function iterateOverBoxesUntilFile(filePath: string): Promise<void> {
  let nextFilePath: string|undefined
  while (nextFilePath = await gui.getNextSourcePathOfBoxIterator()) {
    if (nextFilePath === filePath) {
      return
    }
  }
  throw new Error(filePath+' was not contained in boxIterator')
}
