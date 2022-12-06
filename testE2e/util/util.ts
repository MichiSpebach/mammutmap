import { toMatchImageSnapshot, MatchImageSnapshotOptions } from 'jest-image-snapshot'
import { promises as fsPromises } from 'fs'

expect.extend({ toMatchImageSnapshot })

// TODO: implement CustomMatcher 'toImagify' for jest instead

// TODO: make dirname optional
export async function expectImageToMatchSnapshot(options: {
    image: string|Buffer
    snapshotDirname: string
    snapshotIdentifier?: string
}): Promise<void> {
    expect(options.image).toMatchImageSnapshot({
        ...getSnapshotOptions(options.snapshotDirname), 
        customSnapshotIdentifier: options.snapshotIdentifier
    })
}

// TODO: make dirname optional
export async function expectImageNotToMatchSnapshot(options: {
    image: Buffer
    snapshotDirname: string
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

export function getSnapshotOptions(dirname: string): MatchImageSnapshotOptions { // TODO: make dirname optional
    return {
        customSnapshotsDir: dirname,
        customDiffDir: dirname,
        customReceivedDir: dirname,
        storeReceivedOnFailure: true,
        customDiffConfig: {threshold: 0.5}
    }
}
