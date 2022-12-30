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
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
})

test('zoom in and out', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await gui.moveMouseTo(300, 300)
  await gui.zoom(1500)
  await gui.zoom(2500)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.zoom(-250)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.zoom(500)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.zoom(-485)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
})

test('zoom in and out without waiting', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await gui.moveMouseTo(300, 300)
  await gui.zoomWithoutWaitingInBetween([1500, 2500, -250, 500, -485])
  await gui.clearTerminal()
  await gui.moveMouseTo(300, 300)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
})
/* TODO work in progress
test('zoom out far often', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  for (let i = 0; i < 10; i++) {
    await clearTerminalAndZoom(-400)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'zoom-out-far-often-1'})
    await clearTerminalAndZoom(2000)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'zoom-out-far-often-2'})
  }
}, 15000)

test('zoom in far', async () => {
  // TODO
})
*/
async function clearTerminalAndZoom(zoomDelta: number): Promise<void> {
  await gui.clearTerminal()
  await gui.moveMouseTo(300, 300)
  await gui.zoom(zoomDelta)
}
