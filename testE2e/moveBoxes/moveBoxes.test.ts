import * as gui from '../guiAdapter'
import * as e2eUtil from '../util/util'
import { util as coreUtil } from '../../src/core/util/util'

const snapshotIdentifier = 'move-box'

test('move box', async () => {
    await gui.resetWindow()
    await gui.openFolder('testE2e/moveBoxes/scenario')
    
    await gui.clearTerminal()
    await gui.moveMouseTo(150, 400)
    const expectedLogs: string[] = []
    expect(await gui.getLogs()).toEqual(expectedLogs)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})

    await dragTo(200, 400)
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json')
    expect(await gui.getLogs()).toEqual(expectedLogs)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved'})

    await dragTo(150, 400)
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json')
    expect(await gui.getLogs()).toEqual(expectedLogs)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})
})

test('move box to other folder', async () => { // TODO: activate as soon as bug fixed
    return
    await gui.resetWindow()
    await gui.openFolder('testE2e/moveBoxes/scenario')

    await gui.clearTerminal()
    await gui.moveMouseTo(150, 400)
    const expectedLogs: string[] = []
    expect(await gui.getLogs()).toEqual(expectedLogs)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})

    await dragTo(400, 390)
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenario/0fj1mk72of8/q6shnoldabo to testE2e/moveBoxes/scenario/q6shnoldabo')
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json to testE2e/moveBoxes/scenario/map/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/maproot.mapsettings.json')
    expect(await gui.getLogs()).toEqual(expectedLogs)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved-to-other-folder'})

    await dragTo(150, 400)
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenario/q6shnoldabo to testE2e/moveBoxes/scenario/0fj1mk72of8/q6shnoldabo')
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenario/map/q6shnoldabo.json to testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/maproot.mapsettings.json')
    expect(await gui.getLogs()).toEqual(expectedLogs)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})
})

async function dragTo(x: number, y: number): Promise<void> {
    await gui.mouseDown()
    await coreUtil.wait(100)
    await gui.moveMouseTo(x, y)
    await gui.moveMouseTo(x, y)
    await gui.mouseUp()
    await coreUtil.wait(100) // TODO: otherwise sometimes mouseUp never finishes or next operations mouseDown does not work, improve
}