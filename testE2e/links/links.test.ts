import * as gui from '../guiAdapter'
import * as e2eUtil from '../util/util'

beforeEach(async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/links/scenario')
})

afterAll(async () => {
  await gui.resetWindow()
})

test('highlighting of bordering links of hovered box', async () => {
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.moveMouseTo(400, 200)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.zoom(500)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.moveMouseTo(400, 400)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})

  await gui.moveMouseTo(400, 450)
  await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot()})
}, 10000)

test('highlighting when spamming changing mouse position', async () => {
  for (let round = 0; round < 10; round++) {
    let x: number = 100
    let y: number = 100
    for (;x < 500; x += 50) {
      await gui.moveMouseTo(x, y)
    }
    for (;y < 500; y += 50) {
      await gui.moveMouseTo(x, y)
    }
    for (;x > 100; x -= 50) {
      await gui.moveMouseTo(x, y)
    }
    for (;y > 100; y -= 50) {
      await gui.moveMouseTo(x, y)
    }
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'highlighting-when-spamming-changing-mouse-position'})
  }
}, 15000)
