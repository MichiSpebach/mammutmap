import * as gui from '../guiAdapter'
import * as e2eUtil from '../util/util'
import { util as coreUtil } from '../../src/core/util/util'

const snapshotIdentifier = 'move-box'

test('move box', async () => {
    await gui.resetWindow()
    await gui.openFolder('testE2e/moveBoxes/scenario')
    
    await gui.clearTerminal()
    await gui.moveMouseTo(150, 400)
    expect(await gui.getLogs()).toEqual([])
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})

    await gui.dragTo(200, 400)
    await gui.waitUntilLogsEqual(['Info: saved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json'], 100)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved'})

    await gui.dragTo(150, 400)
    await gui.waitUntilLogsEqual(['Info: saved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json (2)'], 100)
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
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/scenario/0fj1mk72of8/q6shnoldabo' to 'testE2e/moveBoxes/scenario/q6shnoldabo'`)
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json' to 'testE2e/moveBoxes/scenario/map/q6shnoldabo.json'`)
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/maproot.mapsettings.json')
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved-to-other-folder'})

    await gui.dragTo(150, 400)
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/scenario/q6shnoldabo' to 'testE2e/moveBoxes/scenario/0fj1mk72of8/q6shnoldabo'`)
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/scenario/map/q6shnoldabo.json' to 'testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json'`)
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/0fj1mk72of8/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenario/map/maproot.mapsettings.json')
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
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/scenarioWithManyLinks/0fj1mk72of8/q6shnoldabo' to 'testE2e/moveBoxes/scenarioWithManyLinks/q6shnoldabo'`)
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/scenarioWithManyLinks/map/0fj1mk72of8/q6shnoldabo.json' to 'testE2e/moveBoxes/scenarioWithManyLinks/map/q6shnoldabo.json'`)
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenarioWithManyLinks/map/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenarioWithManyLinks/map/maproot.mapsettings.json (13)')
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved-to-other-folder'})

    await gui.dragTo(150, 400)
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/scenarioWithManyLinks/q6shnoldabo' to 'testE2e/moveBoxes/scenarioWithManyLinks/0fj1mk72of8/q6shnoldabo'`)
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/scenarioWithManyLinks/map/q6shnoldabo.json' to 'testE2e/moveBoxes/scenarioWithManyLinks/map/0fj1mk72of8/q6shnoldabo.json'`)
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenarioWithManyLinks/map/0fj1mk72of8/q6shnoldabo.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/scenarioWithManyLinks/map/maproot.mapsettings.json (13)')
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
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/deepScenario/depth1/depth2/depth3/depth4/file' to 'testE2e/moveBoxes/deepScenario/file'`)
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/deepScenario/map/depth1/depth2/depth3/depth4/file.json' to 'testE2e/moveBoxes/deepScenario/map/file.json'`)
    expectedLogs.push('Info: saved testE2e/moveBoxes/deepScenario/map/file.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/deepScenario/map/maproot.mapsettings.json')
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved-to-other-folder'})

    await gui.dragTo(200, 445)
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/deepScenario/file' to 'testE2e/moveBoxes/deepScenario/depth1/depth2/depth3/depth4/file'`)
    expectedLogs.push(`Info: moved 'testE2e/moveBoxes/deepScenario/map/file.json' to 'testE2e/moveBoxes/deepScenario/map/depth1/depth2/depth3/depth4/file.json'`)
    expectedLogs.push('Info: saved testE2e/moveBoxes/deepScenario/map/depth1/depth2/depth3/depth4/file.json')
    expectedLogs.push('Info: saved testE2e/moveBoxes/deepScenario/map/maproot.mapsettings.json')
    await gui.waitUntilLogsEqual(expectedLogs, 100)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})
})

test('move shallow rendered box to other folder', async () => {
    const snapshotIdentifier = 'move-shallow-rendered-box'
    await gui.resetWindow()
    await gui.openFolder('testE2e/moveBoxes/deepScenario')

    await gui.clearTerminal()
    await gui.moveMouseTo(170, 350)
    expect(await gui.getLogs()).toEqual([])
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})

    await gui.dragTo(430, 350)
    await gui.waitUntilLogsEqual([
        `Info: moved 'testE2e/moveBoxes/deepScenario/depth1/depth2' to 'testE2e/moveBoxes/deepScenario/depth2'`,
        `Info: moved 'testE2e/moveBoxes/deepScenario/map/depth1/depth2.json' to 'testE2e/moveBoxes/deepScenario/map/depth2.json'`,
        `Info: moved 'testE2e/moveBoxes/deepScenario/map/depth1/depth2' to 'testE2e/moveBoxes/deepScenario/map/depth2'`,
        'Info: saved testE2e/moveBoxes/deepScenario/map/depth2.json',
        'Info: saved testE2e/moveBoxes/deepScenario/map/maproot.mapsettings.json'
    ], 100)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved-to-other-folder'})

    await gui.moveMouseTo(430, 440)
    await gui.zoom(250)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved-to-other-folder-zoomed'})

    await gui.zoom(-250)
    await gui.zoom(-200) // zoom out 200 and in 200 to ensure that inner boxes are unrendered
    await gui.zoom(200)
    await gui.moveMouseTo(430, 350)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-moved-to-other-folder'})

    await gui.dragTo(170, 350)
    await gui.waitUntilLogsEqual([
        `Info: moved 'testE2e/moveBoxes/deepScenario/depth2' to 'testE2e/moveBoxes/deepScenario/depth1/depth2'`,
        `Info: moved 'testE2e/moveBoxes/deepScenario/map/depth2.json' to 'testE2e/moveBoxes/deepScenario/map/depth1/depth2.json'`,
        `Info: moved 'testE2e/moveBoxes/deepScenario/map/depth2' to 'testE2e/moveBoxes/deepScenario/map/depth1/depth2'`,
        'Info: saved testE2e/moveBoxes/deepScenario/map/depth1/depth2.json',
        'Info: saved testE2e/moveBoxes/deepScenario/map/maproot.mapsettings.json'
    ], 100)
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-origin'})
})