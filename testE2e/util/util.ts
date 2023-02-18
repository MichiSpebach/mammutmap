import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'
import { promises as fsPromises } from 'fs'
import { util } from '../../src/core/util/util'
import * as imageManipulator from './imageManipulatorAdapter'

expect.extend({ toMatchImageSnapshot })

// TODO: implement CustomMatcher 'toImagify' for jest instead

export async function expectImageToMatchSnapshot(options: {
    image: string|Buffer
    snapshotDirname?: string
    snapshotIdentifier?: string
}): Promise<void> {
    const snapshotOptions = {
        ...getSnapshotOptions(options.snapshotDirname), // TODO: getSnapshotOptions(..) needs to be called before await otherwise util.getCallerDirPath() breaks, fix this
        customSnapshotIdentifier: options.snapshotIdentifier
    }

    options.image = await imageManipulator.extendImageWithGreyMargin(options.image, 5) // makes matching with gaussian blur better work at image border

    expect(options.image).toMatchImageSnapshot(snapshotOptions)
}

export async function expectImageNotToMatchSnapshot(options: {
    image: Buffer
    snapshotDirname?: string
    snapshotIdentifier: string
}): Promise<void> {
    try {
        expect(options.image).toMatchImageSnapshot({
            ...getSnapshotOptions(options.snapshotDirname), 
            storeReceivedOnFailure: false, 
            customSnapshotIdentifier: options.snapshotIdentifier
        })
    } catch(error) {
        await fsPromises.unlink('./testE2e/util/'+options.snapshotIdentifier+'-diff.png')
        return
    }
    fail('expected image not to match snapshot')
}

export function getSnapshotOptions(dirname?: string): MatchImageSnapshotOptions {
    if (!dirname) {
        dirname = util.getCallerDirPath()
    }

    return {
        customSnapshotsDir: dirname,
        customDiffDir: dirname,
        customReceivedDir: dirname,
        storeReceivedOnFailure: true,
        customDiffConfig: {threshold: 0.1}, // TODO: bring allowed per pixel difference down to 0.05
        failureThreshold: 0,
        blur: 3 // TODO: bring blur down to 0 or 1 by improving antialiasing recognition
    }
    /*return {
        customSnapshotsDir: dirname,
        customDiffDir: dirname,
        customReceivedDir: dirname,
        storeReceivedOnFailure: true,
        customDiffConfig: {threshold: 0.15}, // allowed per pixel difference customDiffConfig.threshold is way too big
        failureThreshold: 20, // allowed failure count (in pixel) should also be smaller
        blur: 2
    }*/
    /*return {
        customSnapshotsDir: dirname,
        customDiffDir: dirname,
        customReceivedDir: dirname,
        storeReceivedOnFailure: true,
        comparisonMethod: 'ssim',
        customDiffConfig: {
            k1: 1,
            k2: 1,
            downsample: false
        },
        //failureThreshold: 20,
        //blur: 2
    }*/
}
