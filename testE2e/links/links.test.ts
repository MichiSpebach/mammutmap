import * as gui from '../guiAdapter'
import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'

expect.extend({ toMatchImageSnapshot })
const snapshotOptions: MatchImageSnapshotOptions = {
  customSnapshotsDir: __dirname,
  customDiffDir: __dirname,
  customDiffConfig: {threshold: 0.15}
}

afterAll(async () => {
  await gui.resetWindow()
})

test('highlighting of bordering links of hovered box', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/links/scenario')

  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)

  await gui.moveMouseTo(400, 200)
  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)

  await gui.zoom(500)
  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)

  await gui.moveMouseTo(400, 400)
  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)

  await gui.moveMouseTo(400, 450)
  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)
}, 10000)

test('highlighting when spamming changing mouse position', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/links/scenario')

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
    expect(await gui.takeScreenshot()).toMatchImageSnapshot({
      ...snapshotOptions,
      ...{customSnapshotIdentifier: 'highlighting-when-spamming-changing-mouse-position'}
    })
  }
}, 15000)
