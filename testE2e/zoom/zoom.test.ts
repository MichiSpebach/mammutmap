import * as gui from '../guiAdapter'
import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'

expect.extend({ toMatchImageSnapshot })
const snapshotOptions: MatchImageSnapshotOptions = {customSnapshotsDir: __dirname, customDiffDir: __dirname}

afterAll(async () => {
  await gui.resetWindow()
})

test('zoom into deep folder', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await gui.moveMouseTo(300, 300)
  await gui.zoom(5000)
  const image = await gui.takeScreenshot()
  expect(image).toMatchImageSnapshot(snapshotOptions)
})

test('zoom in and out', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await gui.moveMouseTo(300, 300)
  await gui.zoom(1500)
  await gui.zoom(2500)
  const image1 = await gui.takeScreenshot()
  expect(image1).toMatchImageSnapshot(snapshotOptions)

  await gui.zoom(-250)
  const image2 = await gui.takeScreenshot()
  expect(image2).toMatchImageSnapshot(snapshotOptions)

  await gui.zoom(500)
  const image3 = await gui.takeScreenshot()
  expect(image3).toMatchImageSnapshot(snapshotOptions)

  await gui.zoom(-485)
  const image4 = await gui.takeScreenshot()
  expect(image4).toMatchImageSnapshot(snapshotOptions)
})

test('zoom in and out without waiting', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/zoom/scenario')
  await gui.moveMouseTo(300, 300)
  await gui.zoomWithoutWaitingInBetween([1500, 2500, -250, 500, -485])
  await gui.clearTerminal()
  const image = await gui.takeScreenshot()
  expect(image).toMatchImageSnapshot(snapshotOptions)
})
