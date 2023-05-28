import * as gui from '../guiAdapter'
import * as e2eUtil from '../util/util'
import { util as coreUtil } from '../../src/core/util/util'

test('move linkNode into other box', async () => {
    await gui.resetWindow()
    await gui.openFolder('testE2e/moveLinkNodes/scenario')

    await gui.clearTerminal()
    await gui.moveMouseTo(100, 300) // ensures that root box is selected
    await gui.moveMouseTo(115, 300)
    expect(await gui.getLogs()).toEqual([])
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'origin'})
    
    await gui.dragTo(270, 300)
    const expectedLogsVariantA: string[] = [
        'Info: saved testE2e/moveLinkNodes/scenario/map/maproot.mapsettings.json',
        'Info: saved testE2e/moveLinkNodes/scenario/map/5p2442vnde.json',
        'Info: saved testE2e/moveLinkNodes/scenario/map/maproot.mapsettings.json'
    ]
    const expectedLogsVariantB: string[] = [
        'Info: saved testE2e/moveLinkNodes/scenario/map/maproot.mapsettings.json (2)',
        'Info: saved testE2e/moveLinkNodes/scenario/map/5p2442vnde.json'
    ]
    await coreUtil.wait(50) // TODO: otherwise operation may not have finished, improve
    expect([expectedLogsVariantA.sort(), expectedLogsVariantB.sort()]).toContainEqual((await gui.getLogs()).sort())
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'moved-into-other-box'})

    await gui.dragTo(115, 300)
    await coreUtil.wait(50) // TODO: otherwise operation may not have finished, improve
    expect([expectedLogsVariantA.sort(), expectedLogsVariantB.sort()]).toContainEqual((await gui.getLogs()).sort())
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'origin'})
})

test('move linkNode into unrendered box', async () => {
    await gui.resetWindow()
    await gui.openFolder('testE2e/moveLinkNodes/scenario')

    await gui.clearTerminal()
    await gui.moveMouseTo(100, 300) // ensures that root box is selected
    await gui.moveMouseTo(115, 300)
    expect(await gui.getLogs()).toEqual([])
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'origin'})
    
    await gui.dragTo(440, 300)
    const expectedLogsVariantA: string[] = [
        'Info: saved testE2e/moveLinkNodes/scenario/map/maproot.mapsettings.json (2)',
        'Info: saved testE2e/moveLinkNodes/scenario/map/5p2442vnde/r7hopm62bmg.json'
    ]
    const expectedLogsVariantB: string[] = [
        'Info: saved testE2e/moveLinkNodes/scenario/map/maproot.mapsettings.json',
        'Info: saved testE2e/moveLinkNodes/scenario/map/5p2442vnde/r7hopm62bmg.json',
        'Info: saved testE2e/moveLinkNodes/scenario/map/maproot.mapsettings.json'
    ]
    await coreUtil.wait(50) // TODO: otherwise operation may not have finished, improve
    expect([expectedLogsVariantA.sort(), expectedLogsVariantB.sort()]).toContainEqual((await gui.getLogs()).sort())
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'moved-into-unrendered-box'})

    await gui.dragTo(115, 300)
    await coreUtil.wait(50) // TODO: otherwise operation may not have finished, improve
    expect([expectedLogsVariantA.sort(), expectedLogsVariantB.sort()]).toContainEqual((await gui.getLogs()).sort())
    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: 'origin'})
})