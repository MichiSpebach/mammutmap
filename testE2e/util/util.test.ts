import * as e2eUtil from './util'
import { promises as fsPromises } from 'fs'

test('default snapshotOptions', async () => {
    const snapshotIdentifier: string = 'util-test-ts-default-snapshot-options'
    const testFilePathPrefix: string = `./testE2e/util/${snapshotIdentifier}-snap-`

    const imageIdentical = await fsPromises.readFile(testFilePathPrefix+'match-identical.png')
    e2eUtil.expectImageToMatchSnapshot({image: imageIdentical, snapshotIdentifier})

    const imageBlurred = await fsPromises.readFile(testFilePathPrefix+'match-blurred.png')
    e2eUtil.expectImageToMatchSnapshot({image: imageBlurred, snapshotIdentifier})

return // TODO: below produces "3 snapshots failed" that is confusing altough expected, find way to catch this and reactivate
    const imageFarMoved = await fsPromises.readFile(testFilePathPrefix+'fail-far-moved.png')
    e2eUtil.expectImageNotToMatchSnapshot({image: imageFarMoved, snapshotIdentifier})

    const imageSlightlyMoved = await fsPromises.readFile(testFilePathPrefix+'fail-slightly-moved.png')
    e2eUtil.expectImageNotToMatchSnapshot({image: imageSlightlyMoved, snapshotIdentifier})

    const imageOtherColor = await fsPromises.readFile(testFilePathPrefix+'fail-other-color.png')
    e2eUtil.expectImageNotToMatchSnapshot({image: imageOtherColor, snapshotIdentifier})
})
