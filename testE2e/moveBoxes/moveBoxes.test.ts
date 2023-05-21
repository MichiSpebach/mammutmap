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

    await gui.dragTo(200, 400)
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json')
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved'})

    await gui.dragTo(150, 400)
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json')
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})
})

test('move box to other folder', async () => {
    await gui.resetWindow()
    await gui.openFolder('testE2e/moveBoxes/scenario')

    await gui.clearTerminal()
    await gui.moveMouseTo(150, 400)
    const expectedLogs: string[] = []
    expect(await gui.getLogs()).toEqual(expectedLogs)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})

    await gui.dragTo(400, 390)
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenario/0fj1mk72of8/q6shnoldabo to testE2e/moveBoxes/scenario/q6shnoldabo')
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json to testE2e/moveBoxes/scenario/map/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/maproot.mapsettings.json')
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved-to-other-folder'})

    await gui.dragTo(150, 400)
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenario/q6shnoldabo to testE2e/moveBoxes/scenario/0fj1mk72of8/q6shnoldabo')
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenario/map/q6shnoldabo.json to testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/maproot.mapsettings.json')
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})
})

test('move deep box to other folder', async () => {
    const snapshotIdentifier = 'move-deep-box'
    await gui.resetWindow()
    await gui.openFolder('testE2e/moveBoxes/deepScenario')

    await gui.moveMouseTo(100, 250)
    await gui.zoom(250)
    
    await gui.clearTerminal()
    await gui.moveMouseTo(200, 445)
    const expectedLogs: string[] = []
    expect(await gui.getLogs()).toEqual(expectedLogs)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})

    await gui.dragTo(500, 420)
    expectedLogs.push('Info: moved testE2e/moveBoxes/deepScenario/depth1/depth2/depth3/depth4/file to testE2e/moveBoxes/deepScenario/file')
    expectedLogs.push('Info: moved testE2e/moveBoxes/deepScenario/map/depth1/depth2/depth3/depth4/file.json to testE2e/moveBoxes/deepScenario/map/file.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/deepScenario/map/file.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/deepScenario/map/maproot.mapsettings.json')
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved-to-other-folder'})

    await gui.dragTo(200, 445)
    expectedLogs.push('Info: moved testE2e/moveBoxes/deepScenario/file to testE2e/moveBoxes/deepScenario/depth1/depth2/depth3/depth4/file')
    expectedLogs.push('Info: moved testE2e/moveBoxes/deepScenario/map/file.json to testE2e/moveBoxes/deepScenario/map/depth1/depth2/depth3/depth4/file.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/deepScenario/map/depth1/depth2/depth3/depth4/file.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/deepScenario/map/maproot.mapsettings.json')
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})
})

test('move box with many links to other folder', async () => {
    const snapshotIdentifier = 'move-box-with-many-links'
    await gui.resetWindow()
    await gui.openFolder('testE2e/moveBoxes/scenarioWithManyLinks')

    await gui.clearTerminal()
    await gui.moveMouseTo(150, 400)
    const expectedLogs: string[] = []
    expect(await gui.getLogs()).toEqual(expectedLogs)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})

    await gui.dragTo(400, 390)
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenarioWithManyLinks/0fj1mk72of8/q6shnoldabo to testE2e/moveBoxes/scenarioWithManyLinks/q6shnoldabo')
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenarioWithManyLinks/map/0fj1mk72of8/q6shnoldabo.json to testE2e/moveBoxes/scenarioWithManyLinks/map/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenarioWithManyLinks/map/q6shnoldabo.json')
    for (let i = 0; i < 13; i++) {
        expectedLogs.push('Info: saved testE2e/moveBoxes/scenarioWithManyLinks/map/maproot.mapsettings.json')
    }
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved-to-other-folder'})

    await gui.dragTo(150, 400)
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenarioWithManyLinks/q6shnoldabo to testE2e/moveBoxes/scenarioWithManyLinks/0fj1mk72of8/q6shnoldabo')
    expectedLogs.push('Info: moved testE2e/moveBoxes/scenarioWithManyLinks/map/q6shnoldabo.json to testE2e/moveBoxes/scenarioWithManyLinks/map/0fj1mk72of8/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenarioWithManyLinks/map/0fj1mk72of8/q6shnoldabo.json')
    for (let i = 0; i < 13; i++) {
        expectedLogs.push('Info: saved testE2e/moveBoxes/scenarioWithManyLinks/map/maproot.mapsettings.json')
    }
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})
})