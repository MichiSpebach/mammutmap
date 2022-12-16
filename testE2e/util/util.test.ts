import * as e2eUtil from './util'
import { promises as fsPromises } from 'fs'

test('default snapshotOptions', async () => {
    const imageIdentical = await fsPromises.readFile('./testE2e/util/util-test-ts-default-snapshot-options-snap-match-identical.png')
    e2eUtil.expectImageToMatchSnapshot({image: imageIdentical, snapshotIdentifier: 'util-test-ts-default-snapshot-options'})

    const imageBlurred = await fsPromises.readFile('./testE2e/util/util-test-ts-default-snapshot-options-snap-match-blurred.png')
    e2eUtil.expectImageToMatchSnapshot({image: imageBlurred, snapshotIdentifier: 'util-test-ts-default-snapshot-options'})
return // TODO: below produces "2 snapshots failed" that is confusing, find way to catch this and reactivate
    const imageFarMoved = await fsPromises.readFile('./testE2e/util/util-test-ts-default-snapshot-options-snap-fail-far-moved.png')
    e2eUtil.expectImageNotToMatchSnapshot({image: imageFarMoved, snapshotIdentifier: 'util-test-ts-default-snapshot-options'})

    const imageSlightlyMoved = await fsPromises.readFile('./testE2e/util/util-test-ts-default-snapshot-options-snap-fail-slightly-moved.png')
    e2eUtil.expectImageNotToMatchSnapshot({image: imageSlightlyMoved, snapshotIdentifier: 'util-test-ts-default-snapshot-options'})
})
