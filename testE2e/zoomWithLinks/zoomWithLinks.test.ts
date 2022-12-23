import * as gui from '../guiAdapter'
import * as e2eUtil from '../util/util'

test('spamming zoom in and out while hover over link', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoomWithLinks/scenario')

  await gui.moveMouseTo(300, 300)

  for (let round = 0; round < 10; round++) {
    await gui.zoom(2000)
    await clearTerminalAndZoom(2000)
    e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'spamming-zoom-in-and-out-1'})

    await gui.zoom(-400)
    await clearTerminalAndZoom(-400)
    e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'spamming-zoom-in-and-out-2'})
  }
}, 100000)

async function clearTerminalAndZoom(zoomDelta: number): Promise<void> {
  await gui.clearTerminal()
  await gui.moveMouseTo(300, 300)
  await gui.zoom(zoomDelta)
}
