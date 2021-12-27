import * as gui from '../guiAdapter'
import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'

expect.extend({ toMatchImageSnapshot })
const snapshotOptions: MatchImageSnapshotOptions = {customSnapshotsDir: __dirname, customDiffDir: __dirname}

afterAll(async () => {
  await gui.resetWindow()
})

test('watch and unwatch not rendered box', async () => {
  await gui.resetWindow()
  await gui.openFolder('testE2e/pluginFacade/scenario')

  await gui.watchBox('testE2e/pluginFacade/scenario/c/b')
  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)

  await gui.unwatchBox('testE2e/pluginFacade/scenario/c/b')
  expect(await gui.takeScreenshot()).toMatchImageSnapshot(snapshotOptions)
})
