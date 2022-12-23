import * as gui from '../guiAdapter'
import * as e2eUtil from '../util/util'

afterAll(async () => {
  await gui.resetWindow()
})

test('watch and unwatch not rendered box', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/pluginFacade/scenario')

  await gui.watchBox('testE2e/pluginFacade/scenario/c/b')
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.unwatchBox('testE2e/pluginFacade/scenario/c/b')
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
})
