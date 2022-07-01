import { Box } from '../../src/box/Box'
import { BoxManager, init as initBoxManager } from '../../src/box/BoxManager'
import { FolderBox } from '../../src/box/FolderBox'
import { LinkEnd } from '../../src/box/LinkEnd'
import { LinkEndData } from '../../src/box/LinkEndData'
import { RootFolderBox } from '../../src/box/RootFolderBox'
import { WayPointData } from '../../src/box/WayPointData'
import { DocumentObjectModelAdapter, init as initDocumentObjectModelAdapter } from '../../src/domAdapter'
import { util } from '../../src/util'
import * as boxFactory from './factories/boxFactory'
import * as linkEndFactory from './factories/linkEndFactory'

const actualLogWarning: (message: string) => void = util.logWarning

beforeAll(() => {
    const domAdapterMock: DocumentObjectModelAdapter = {} as DocumentObjectModelAdapter
    domAdapterMock.appendChildTo = () => Promise.resolve()
    initDocumentObjectModelAdapter(domAdapterMock)
})

beforeEach(() => {
    // reset logWarning in case that a test mocked and overwrote it to prevent unexpected warnings to be suppressed
    util.logWarning = actualLogWarning

    initBoxManager(new BoxManager)
})

test('reorderMapDataPathWithoutRender zero depth, without any changes', async () => {
    const scene = setupRenderedScenarioWithDepthZero()
    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path[0]).toEqual({boxId: 'managingBoxId', boxName: 'managingBoxName', x: 75, y: 50})

    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.linkEnd.getManagingBox())

    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path[0]).toEqual({boxId: 'managingBoxId', boxName: 'managingBoxName', x: 75, y: 50})
    expect(scene.linkEnd.getManagingBox().borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
})

test('reorderMapDataPathWithoutRender misplaced managingBox', async () => {
    const logWarning = jest.fn()
    util.logWarning = logWarning

    const scene = setupRenderedScenarioWithDepthZero()
    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path[0]).toEqual({boxId: 'managingBoxId', boxName: 'managingBoxName', x: 75, y: 50})
    const actualManagingBox: Box = scene.linkEnd.getManagingBox()
    const misplacedManagingBox: Box = boxFactory.rootFolderOf('misplacedManagingBoxId')
    scene.linkEnd.getManagingBox = () => misplacedManagingBox

    await scene.linkEnd.reorderMapDataPathWithoutRender(actualManagingBox)

    expect(logWarning).toBeCalledWith('newManagingBox should already be set to referenceLink when calling reorderMapDataPathWithoutRender(..), this will likely lead to further problems')
    expect(logWarning).toBeCalledWith('did not find managingBox while reorderMapDataPathWithoutRender(..) of LinkEnd with id linkEndId, this could happen when reorderMapDataPathWithoutRender(..) is called before the new managingBox is set')
    expect(logWarning).toBeCalledTimes(2)
})

test('reorderMapDataPathWithoutRender deep, without any changes', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])

    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
})

test('reorderMapDataPathWithoutRender deep, without any changes, while dragging', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getReferenceLink().render = () => Promise.resolve()

    await scene.linkEnd.dragStart(800, 400)
    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxIdName', x: 50, y: 50}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
})

test('reorderMapDataPathWithoutRender deep, drag into parentBox', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getReferenceLink().render = () => Promise.resolve()

    await scene.linkEnd.drag(825, 390, scene.innerBox, false) // TODO: use better values
    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 74.41406249999997, y: 30.468750000000018}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
})

test('reorderMapDataPathWithoutRender deep, drag into managingBox', () => {
    // TODO WIP
})

test('reorderMapDataPathWithoutRender deep, drag into rootBox', () => {
    // TODO WIP
})

test('reorderMapDataPathWithoutRender deep, move managingBox inside', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getManagingBox = () => scene.innerBox

    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.innerBox)

    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
})

test('reorderMapDataPathWithoutRender deep, move managingBox outside', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getManagingBox = () => scene.rootBox

    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.rootBox)

    expect(scene.linkEndData.path.length).toBe(3)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'outerBoxId', boxName: 'outerBoxIdName', x: 50, y: 50},
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    expect(scene.rootBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
})

test('reorderMapDataPathWithoutRender deep, without any changes, shallow rendered', async () => {
    const scene = setupShallowRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])

    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
})

function setupRenderedScenarioWithDepthZero(): {linkEnd: LinkEnd, linkEndData: LinkEndData} {
    const wayPoint = new WayPointData('managingBoxId', 'managingBoxName', 75, 50)
    const linkEndData = new LinkEndData([wayPoint])

    const managingBox: RootFolderBox = boxFactory.rootFolderOf('managingBoxId')

    const linkEnd = linkEndFactory.renderedOf(linkEndData, managingBox, [managingBox])

    return {linkEnd, linkEndData}
}

function setupRenderedScenarioWithDepth(): {
    linkEnd: LinkEnd, 
    linkEndData: LinkEndData, 
    rootBox: Box,
    outerBox: Box,
    innerBox: Box,
    deepBox: Box,
} {
    const innerWayPoint = new WayPointData('innerBoxId', 'innerBoxName', 50, 50)
    const deepWayPoint = new WayPointData('deepBoxId', 'deepBoxName', 50, 50)
    const linkEndData = new LinkEndData([innerWayPoint, deepWayPoint])

    const rootBox: RootFolderBox = boxFactory.rootFolderOf('rootBoxId')
    const outerBox: FolderBox = boxFactory.folderOf('outerBoxId', rootBox)
    const innerBox: FolderBox = boxFactory.folderOf('innerBoxId', outerBox)
    const deepBox: FolderBox = boxFactory.folderOf('deepBoxId', innerBox)
    rootBox.addBox(outerBox)
    outerBox.addBox(innerBox)
    innerBox.addBox(deepBox)
    const renderedBoxesInPath: Box[] = [innerBox, deepBox]

    const linkEnd = linkEndFactory.renderedOf(linkEndData, outerBox, renderedBoxesInPath)

    return {linkEnd, linkEndData, rootBox, outerBox, innerBox, deepBox}
}

function setupShallowRenderedScenarioWithDepth(): {
    linkEnd: LinkEnd, 
    linkEndData: LinkEndData, 
    rootBox: Box,
    outerBox: Box,
    innerBox: Box
} {
    const innerWayPoint = new WayPointData('innerBoxId', 'innerBoxName', 50, 50)
    const deepWayPoint = new WayPointData('deepBoxId', 'deepBoxName', 50, 50)
    const linkEndData = new LinkEndData([innerWayPoint, deepWayPoint])

    const rootBox: RootFolderBox = boxFactory.rootFolderOf('rootBoxId')
    const outerBox: FolderBox = boxFactory.folderOf('outerBoxId', rootBox)
    const innerBox: FolderBox = boxFactory.folderOf('innerBoxId', outerBox)
    rootBox.addBox(outerBox)
    outerBox.addBox(innerBox)
    const renderedBoxesInPath: Box[] = [innerBox]

    const linkEnd = linkEndFactory.renderedOf(linkEndData, outerBox, renderedBoxesInPath)

    return {linkEnd, linkEndData, rootBox, outerBox, innerBox}
}