import * as gui from '../guiAdapter'
import * as e2eUtil from '../util/util'

afterAll(async () => {
  await gui.resetWindow()
})

test('zoom into deep folder', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await gui.moveMouseTo(300, 300)
  await gui.zoom(5000)
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
})

test('zoom in and out', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await gui.moveMouseTo(300, 300)
  await gui.zoom(1500)
  await gui.zoom(2500)
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.zoom(-250)
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.zoom(500)
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.zoom(-485)
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
})

test('zoom in and out without waiting', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await gui.moveMouseTo(300, 300)
  await gui.zoomWithoutWaitingInBetween([1500, 2500, -250, 500, -485])
  await gui.clearTerminal()
  await gui.moveMouseTo(300, 300)
  e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
})
