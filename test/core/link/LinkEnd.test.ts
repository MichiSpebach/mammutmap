import { Box } from '../../../src/core/box/Box'
import { BoxManager, init as initBoxManager } from '../../../src/core/box/BoxManager'
import { FolderBox } from '../../../src/core/box/FolderBox'
import { LinkEnd } from '../../../src/core/link/LinkEnd'
import { LinkEndData } from '../../../src/core/mapData/LinkEndData'
import { RootFolderBox } from '../../../src/core/box/RootFolderBox'
import { WayPointData } from '../../../src/core/mapData/WayPointData'
import { DocumentObjectModelAdapter, init as initDocumentObjectModelAdapter } from '../../../src/core/domAdapter'
import { RenderManager, init as initRenderManager } from '../../../src/core/RenderManager'
import { NodeData} from '../../../src/core/mapData/NodeData'
import { NodeWidget } from '../../../src/core/node/NodeWidget'
import { util } from '../../../src/core/util/util'
import * as boxFactory from '../box/factories/boxFactory'
import * as linkEndFactory from './factories/linkEndFactory'
import { LinkData } from '../../../src/core/mapData/LinkData'
import { ClientRect } from '../../../src/core/ClientRect'

const actualLogWarning: (message: string) => void = util.logWarning

beforeAll(() => {
    const domAdapterMock: DocumentObjectModelAdapter = {} as DocumentObjectModelAdapter
    domAdapterMock.appendChildTo = () => Promise.resolve()
    domAdapterMock.addContentTo = () => Promise.resolve()
    domAdapterMock.setStyleTo = () => Promise.resolve()
    domAdapterMock.addClassTo = () => Promise.resolve()
    domAdapterMock.batch = () => Promise.resolve()
    domAdapterMock.addDragListenerTo = () => Promise.resolve()
    domAdapterMock.addEventListenerTo = () => Promise.resolve()
    domAdapterMock.addEventListenerAdvancedTo = () => Promise.resolve()
    initDocumentObjectModelAdapter(domAdapterMock)
})

beforeEach(() => {
    // reset logWarning in case that a test mocked and overwrote it to prevent unexpected warnings to be suppressed
    util.logWarning = actualLogWarning

    initBoxManager(new BoxManager())
    initRenderManager(new RenderManager()) // TODO: runs into timeout but only for multiple tests
})

test('reorderMapDataPathWithoutRender zero depth, without any changes', async () => {
    const scene = setupRenderedScenarioWithDepthZero()
    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path[0]).toEqual({boxId: 'managingBoxId', boxName: 'managingBoxName', x: 75, y: 50})

    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.linkEnd.getManagingBox(), movedWayPoint: scene.linkEnd.getManagingBox()})

    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path[0]).toEqual({boxId: 'managingBoxId', boxName: 'managingBoxName', x: 75, y: 50})
})

test('reorderMapDataPathWithoutRender misplaced managingBox', async () => {
    const logWarning = jest.fn()
    util.logWarning = logWarning

    const scene = setupRenderedScenarioWithDepthZero()
    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path[0]).toEqual({boxId: 'managingBoxId', boxName: 'managingBoxName', x: 75, y: 50})
    const actualManagingBox: Box = scene.linkEnd.getManagingBox()
    const misplacedManagingBox: Box = boxFactory.rootFolderOf({idOrProjectSettings:'misplacedManagingBoxId', rendered: true})
    scene.linkEnd.getManagingBox = () => misplacedManagingBox

    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: actualManagingBox, movedWayPoint: actualManagingBox})

    expect(logWarning).toBeCalledWith('newManagingBox should already be set to referenceLink when calling reorderMapDataPathWithoutRender(..), this will likely lead to further problems')
    expect(logWarning).toBeCalledWith('did not find managingBox while reorderMapDataPathWithoutRender(..) of LinkEnd with id linkEndId, this could happen when reorderMapDataPathWithoutRender(..) is called before the new managingBox is set')
    expect(logWarning).toBeCalledWith('Link with id linkId in fakeProjectSettingsFilePath/fakeSrcRootPath has path with no rendered boxes. This only happens when mapData is corrupted or LinkEnd::getRenderedPath() is called when it shouldn\'t. Defaulting LinkEnd to center of managingBox.')
    expect(logWarning).toBeCalledTimes(3)
})

test('reorderMapDataPathWithoutRender deep, without any changes', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])

    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.outerBox, movedWayPoint: scene.innerBox})

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
})

test('reorderMapDataPathWithoutRender deep, without any changes, while dragging', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getReferenceLink().renderWithOptions = () => Promise.resolve()

    await scene.linkEnd.dragStart(800, 400, scene.linkEnd.getDropTargetAtDragStart(), false)
    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.outerBox, movedWayPoint: scene.deepBox})

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxIdName', x: 50, y: 50}
    ])
})

test('reorderMapDataPathWithoutRender deep, change only position, while dragging with snapToGrid', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getReferenceLink().render = () => Promise.resolve()

    await scene.linkEnd.drag(850, 420, scene.deepBox, true)
    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.outerBox, movedWayPoint: scene.deepBox})

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 65.6, y: 60.8},
        {boxId: 'deepBoxId', boxName: 'deepBoxIdName', x: 76, y: 68}
    ])
})

test('reorderMapDataPathWithoutRender deep, drag into nodeWidget; then drag nodeWidget into parentBox; then drag nodeWidget back', async () => {
    const scene = await setupRenderedScenarioWithDepthAndNode()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getReferenceLink().render = () => Promise.resolve()

    expect(await scene.outerBox.getClientRect()).toEqual({x: 512, y: 256, width: 576, height: 288})
    expect(await scene.innerBox.getClientRect()).toEqual({x: 627.2, y: 313.6, width: expect.closeTo(345.6), height: expect.closeTo(172.8)})
    const nodeClientRect: ClientRect = await scene.node.getClientShape()
    expect(nodeClientRect).toEqual({x: expect.closeTo(627.2+345.6*0.75 - 14/2), y: 313.6+172.8*0.25 - 14/2, width: 14, height: 14})
    expect(scene.node.getRenderPosition()).toEqual({percentX: 75, percentY: 25})

    // drag linkEnd to nodeWidget
    await scene.linkEnd.drag(nodeClientRect.x + 14/2, nodeClientRect.y + 14/2, scene.node, false)
    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.outerBox, movedWayPoint: scene.node})

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 75, y: 25},
        {boxId: 'nodeId', boxName: 'nodenodeId', x: 50, y: 50}
    ])

    // drag nodeWidget into parentBox
    scene.linkEnd.getReferenceLink().reorderAndSaveAndRender = async () => await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.outerBox, movedWayPoint: scene.node})
    await scene.node.drag(512, 256, scene.outerBox, false)
    await scene.node.dragEnd(scene.outerBox)

    expect(scene.linkEndData.path).toEqual([
        {boxId: 'nodeId', boxName: 'nodenodeId', x: 50, y: 50}
    ])

    // drag nodeWidget back
    scene.linkEnd.getReferenceLink().reorderAndSaveAndRender = async () => await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.outerBox, movedWayPoint: scene.node})
    await scene.node.drag(nodeClientRect.x + 14/2, nodeClientRect.y + 14/2, scene.innerBox, false)
    await scene.node.dragEnd(scene.innerBox)

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 75, y: 25},
        {boxId: 'nodeId', boxName: 'nodenodeId', x: 50, y: 50}
    ])
})

test('reorderMapDataPathWithoutRender deep, drag into parentBox', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getReferenceLink().render = () => Promise.resolve()

    await scene.linkEnd.drag(627.2+345.6*0.25, 313.6+172.8*0.31, scene.innerBox, false)
    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.outerBox, movedWayPoint: scene.innerBox})

    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 25, y: 31}
    ])
})

test('reorderMapDataPathWithoutRender deep, drag into parentBox with snapToGrid', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getReferenceLink().render = () => Promise.resolve()

    await scene.linkEnd.drag(627.2+345.6*0.25, 313.6+172.8*0.31, scene.innerBox, true)
    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.outerBox, movedWayPoint: scene.innerBox})

    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 24, y: 32}
    ])
})

test('reorderMapDataPathWithoutRender deep, drag into managingBox', async () => {
  const scene = setupRenderedScenarioWithDepth()
  expect(scene.linkEndData.path.length).toBe(2)
  expect(scene.linkEndData.path).toEqual([
      {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
      {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
  ])
  scene.linkEnd.getReferenceLink().render = () => Promise.resolve()

  await scene.linkEnd.drag(512+576*0.75, 256+288*0.25, scene.outerBox, false)
  await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.outerBox, movedWayPoint: scene.outerBox})

  expect(scene.linkEndData.path.length).toBe(1)
  expect(scene.linkEndData.path).toEqual([
      {boxId: 'outerBoxId', boxName: 'outerBoxIdName', x: 75, y: 25}
  ])
})

test('reorderMapDataPathWithoutRender deep, drag into rootBox', async () => {
  const scene = setupRenderedScenarioWithDepth()
  expect(scene.linkEndData.path.length).toBe(2)
  expect(scene.linkEndData.path).toEqual([
      {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
      {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
  ])
  scene.linkEnd.getReferenceLink().render = () => Promise.resolve()
  scene.linkEnd.getManagingBox = () => scene.rootBox

  await scene.linkEnd.drag(320+960*0.9, 160+480*0.6, scene.rootBox, false)
  await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.rootBox, movedWayPoint: scene.rootBox})

  expect(scene.linkEndData.path.length).toBe(1)
  expect(scene.linkEndData.path).toEqual([
      {boxId: 'rootBoxId', boxName: 'fakeProjectSettingsFilePath/fakeSrcRootPath', x: 90, y: 60}
  ])
})

test('reorderMapDataPathWithoutRender deep, move managingBox inside', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getManagingBox = () => scene.innerBox

    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.innerBox, movedWayPoint: scene.deepBox})

    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
})

test('reorderMapDataPathWithoutRender deep, move managingBox outside', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    expect(scene.linkEnd.getReferenceLink().getManagingBox()).toBe(scene.outerBox)
    expect(scene.linkEnd.getManagingBox()).toBe(scene.outerBox)

    scene.linkEnd.getReferenceLink().getManagingBox = () => scene.rootBox
    expect(scene.linkEnd.getManagingBox()).toBe(scene.rootBox)

    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.rootBox, movedWayPoint: scene.deepBox})

    expect(scene.linkEndData.path.length).toBe(3)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'outerBoxId', boxName: 'outerBoxIdName', x: 50, y: 50},
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
})

test('reorderMapDataPathWithoutRender deep, without any changes, shallow rendered', async () => {
    const scene = setupShallowRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])

    await scene.linkEnd.reorderMapDataPathWithoutRender({newManagingBoxForValidation: scene.outerBox, movedWayPoint: scene.innerBox})

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
})

function setupRenderedScenarioWithDepthZero(): {linkEnd: LinkEnd, linkEndData: LinkEndData} {
    const wayPoint = WayPointData.buildNew('managingBoxId', 'managingBoxName', 75, 50)
    const linkEndData = new LinkEndData([wayPoint])

    const managingBox: RootFolderBox = boxFactory.rootFolderOf({idOrProjectSettings: 'managingBoxId', rendered: true})

    const linkEnd = linkEndFactory.of(linkEndData, managingBox)

    return {linkEnd, linkEndData}
}

async function setupRenderedScenarioWithDepthAndNode(): Promise<{
    linkEnd: LinkEnd
    linkEndData: LinkEndData
    rootBox: Box
    outerBox: Box
    innerBox: Box
    deepBox: Box
    node: NodeWidget
}> {
    const scene = setupRenderedScenarioWithDepth()
    const boxMapLinkData = new LinkData('linkId', scene.linkEndData, scene.linkEndData)
    scene.linkEnd.getReferenceLink().getData = () => boxMapLinkData
    await scene.innerBox.nodes.add(new NodeData('nodeId', 75, 25))
    return { ...scene, node: scene.innerBox.nodes.getNodeById('nodeId')! }
}

function setupRenderedScenarioWithDepth(): {
    linkEnd: LinkEnd,
    linkEndData: LinkEndData,
    rootBox: Box,
    outerBox: Box,
    innerBox: Box,
    deepBox: Box,
} {
    const innerWayPoint = WayPointData.buildNew('innerBoxId', 'innerBoxName', 50, 50)
    const deepWayPoint = WayPointData.buildNew('deepBoxId', 'deepBoxName', 50, 50)
    const linkEndData = new LinkEndData([innerWayPoint, deepWayPoint])

    const rootBox: RootFolderBox = boxFactory.rootFolderOf({idOrProjectSettings: 'rootBoxId', rendered: true})
    const outerBox: FolderBox = boxFactory.folderOf({idOrData: 'outerBoxId', parent: rootBox, rendered: true})
    const innerBox: FolderBox = boxFactory.folderOf({idOrData: 'innerBoxId', parent: outerBox, rendered: true})
    const deepBox: FolderBox = boxFactory.folderOf({idOrData: 'deepBoxId', parent: innerBox, rendered: true})
    rootBox.addBox(outerBox)
    outerBox.addBox(innerBox)
    innerBox.addBox(deepBox)

    const linkEnd = linkEndFactory.of(linkEndData, outerBox)

    return {linkEnd, linkEndData, rootBox, outerBox, innerBox, deepBox}
}

function setupShallowRenderedScenarioWithDepth(): {
    linkEnd: LinkEnd,
    linkEndData: LinkEndData,
    rootBox: Box,
    outerBox: Box,
    innerBox: Box
} {
    const innerWayPoint = WayPointData.buildNew('innerBoxId', 'innerBoxName', 50, 50)
    const deepWayPoint = WayPointData.buildNew('deepBoxId', 'deepBoxName', 50, 50)
    const linkEndData = new LinkEndData([innerWayPoint, deepWayPoint])

    const rootBox: RootFolderBox = boxFactory.rootFolderOf({idOrProjectSettings: 'rootBoxId'})
    const outerBox: FolderBox = boxFactory.folderOf({idOrData: 'outerBoxId', parent: rootBox, rendered: true})
    const innerBox: FolderBox = boxFactory.folderOf({idOrData: 'innerBoxId', parent: outerBox, rendered: true})
    rootBox.addBox(outerBox)
    outerBox.addBox(innerBox)

    const linkEnd = linkEndFactory.of(linkEndData, outerBox)

    return {linkEnd, linkEndData, rootBox, outerBox, innerBox}
}
