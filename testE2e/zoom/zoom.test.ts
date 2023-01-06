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

  await gui.zoom(-500)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.zoom(500)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.zoom(-16000)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
})

test('zoom in and out without waiting', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await gui.moveMouseTo(300, 300)
  await gui.zoomWithoutWaitingInBetween([1500, 2500, -500, 500, -16000])
  await gui.clearTerminal()
  await gui.moveMouseTo(300, 300)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
})

test('zoom out far often', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await clearTerminalAndZoom(2000)
  for (let i = 0; i < 5; i++) {
    await clearTerminalAndZoom(-10000)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'zoom-out-far-often-1'})
    await clearTerminalAndZoom(10000)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'zoom-out-far-often-2'})
  }
}, 10000)

test('zoom in extremely deep', async () => {
  // TODO
})

async function clearTerminalAndZoom(zoomDelta: number): Promise<void> {
  await gui.clearTerminal()
  await gui.moveMouseTo(300, 300)
  await gui.zoom(zoomDelta)
}
