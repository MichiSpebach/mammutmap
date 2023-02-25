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

  for (let i = 0; i < 10; i++) {
    await clearTerminalAndZoom(-10000)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'zoom-out-far-often-1'})
    await clearTerminalAndZoom(10000)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'zoom-out-far-often-2'})
  }
}, 15000)

test('zoom in to ultimate depth and out again', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/extremeDeepScenario')
  await gui.moveMouseTo(300, 300)

  for (let i = 1; i <= 6; i++) {
    await gui.zoom(4000)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'zoom-in-to-ultimate-depth-and-out-again-'+i})
  }
  for (let i = 5; i >= 0; i--) {
    await gui.zoom(-4000)
    await gui.zoom(-500) // otherwise not ensured that inner box is unrendered,
    await gui.zoom(500) // size when box should unrender is specified smaller than when it should render (improves ux)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'zoom-in-to-ultimate-depth-and-out-again-'+i})
  }
}, 10000)

async function clearTerminalAndZoom(zoomDelta: number): Promise<void> {
  await gui.clearTerminal()
  await gui.moveMouseTo(300, 300)
  await gui.zoom(zoomDelta)
}
