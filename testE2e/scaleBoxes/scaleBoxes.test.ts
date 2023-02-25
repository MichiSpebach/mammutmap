import * as gui from '../guiAdapter'
import * as e2eUtil from '../util/util'

test('scale box by dragging right side', async () => {
    await gui.resetWindow()
    await gui.openFolder('testE2e/scaleBoxes/scenario')
    
    const snapshotIdentifier = 'scale-box-by-dragging-right-side'
    await gui.clearTerminal()
    await gui.moveMouseTo(220, 300)
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-narrow'})

    await gui.mouseDown()
    await gui.moveMouseTo(400, 300)
    await gui.mouseUp()

    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-wide'})

    await gui.mouseDown()
    await gui.moveMouseTo(220, 300)
    await gui.mouseUp()

    await gui.clearTerminal()
    await e2eUtil.expectImageToMatchSnapshot({image: await gui.takeScreenshot(), snapshotIdentifier: snapshotIdentifier+'-narrow'})
})