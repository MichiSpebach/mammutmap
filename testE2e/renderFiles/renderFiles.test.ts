import * as gui from '../guiAdapter'
import * as e2eUtil from '../util/util'

afterAll(async () => {
  await gui.resetWindow()
})

test('file with special characters', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/renderFiles/scenario')
  
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
})
