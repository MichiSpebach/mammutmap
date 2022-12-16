import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'
import { promises as fsPromises } from 'fs'
import { util } from '../../src/util'

expect.extend({ toMatchImageSnapshot })

// TODO: implement CustomMatcher 'toImagify' for jest instead

export async function expectImageToMatchSnapshot(options: {
    image: string|Buffer
    snapshotDirname?: string
    snapshotIdentifier?: string
}): Promise<void> {
    expect(options.image).toMatchImageSnapshot({
        ...getSnapshotOptions(options.snapshotDirname), 
        customSnapshotIdentifier: options.snapshotIdentifier
    })
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
        customDiffConfig: {threshold: 0.5}
    }
}
