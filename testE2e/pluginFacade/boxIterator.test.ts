import * as gui from '../guiAdapter'
import * as e2eUtil from '../util/util'

afterAll(async () => {
  await gui.resetWindow()
})

test('iterate over boxes', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/pluginFacade/scenario')
  await gui.startBoxIterator()

  await gui.getNextSourcePathOfBoxIterator()
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await iterateOverBoxesUntilFile('testE2e/pluginFacade/scenario/c/a/a')
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await iterateOverBoxesUntilFile('testE2e/pluginFacade/scenario/d/a/a/a')
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  expect(await gui.getNextSourcePathOfBoxIterator()).toBeUndefined()
  await gui.clearWatchedBoxes()
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
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
