import { Box } from '../../src/box/Box'
import { BoxManager, init as initBoxManager } from '../../src/box/BoxManager'
import { FolderBox } from '../../src/box/FolderBox'
import { LinkEnd } from '../../src/box/LinkEnd'
import { LinkEndData } from '../../src/box/LinkEndData'
import { RootFolderBox } from '../../src/box/RootFolderBox'
import { WayPointData } from '../../src/box/WayPointData'
import { DocumentObjectModelAdapter, init as initDocumentObjectModelAdapter } from '../../src/domAdapter'
import { RenderManager, init as initRenderManager } from '../../src/RenderManager'
import { NodeData} from '../../src/mapData/NodeData'
import { NodeWidget } from '../../src/node/NodeWidget'
import { util } from '../../src/util'
import * as boxFactory from './factories/boxFactory'
import * as linkEndFactory from './factories/linkEndFactory'
import { BoxMapLinkData } from '../../src/box/BoxMapLinkData'

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
    expect(logWarning).toBeCalledWith('Corrupted mapData detected: Link with id linkId in fakeProjectSettingsFilePath/fakeSrcRootPath has path with no rendered boxes, this only happens when mapData is corrupted. Defaulting LinkEnd to center of managingBox.')
    expect(logWarning).toBeCalledTimes(3)
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

test('reorderMapDataPathWithoutRender deep, change only position, while dragging with snapToGrid', async () => {
    const scene = setupRenderedScenarioWithDepth()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getReferenceLink().render = () => Promise.resolve()

    await scene.linkEnd.drag(850, 420, scene.deepBox, true)
    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 65.6, y: 60.8},
        {boxId: 'deepBoxId', boxName: 'deepBoxIdName', x: 76, y: 68}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
})

test('reorderMapDataPathWithoutRender deep, drag into nodeWidget; then drag nodeWidget into parentBox; then drag nodeWidget back', async () => {
    const scene = await setupRenderedScenarioWithDepthAndNode()
    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxName', x: 50, y: 50},
        {boxId: 'deepBoxId', boxName: 'deepBoxName', x: 50, y: 50}
    ])
    scene.linkEnd.getReferenceLink().render = () => Promise.resolve()

    // drag linkEnd into nodeWidget
    await scene.linkEnd.drag(627.2+345.6*0.8, 313.6+172.8*0.2, scene.node, false)
    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 80, y: 20},
        {boxId: 'nodeId', boxName: 'nodenodeId', x: 50, y: 50}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.node.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)

    // drag nodeWidget into parentBox
    ;(scene.node as any).managingBox = scene.outerBox
    // TODO: remove from innerBox
    ;(scene.outerBox.nodes as any).nodeWidgets.push(scene.node)

    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

    expect(scene.linkEndData.path).toEqual([
        {boxId: 'nodeId', boxName: 'nodenodeId', x: 50, y: 50}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.node.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)

    // drag nodeWidget back
    ;(scene.node as any).managingBox = scene.innerBox
    // TODO: remove from outerBox
    ;(scene.innerBox.nodes as any).nodeWidgets.push(scene.node)

    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

    expect(scene.linkEndData.path.length).toBe(2)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 80, y: 20},
        {boxId: 'nodeId', boxName: 'nodenodeId', x: 50, y: 50}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.node.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
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
    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 25, y: 31}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
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
    await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

    expect(scene.linkEndData.path.length).toBe(1)
    expect(scene.linkEndData.path).toEqual([
        {boxId: 'innerBoxId', boxName: 'innerBoxIdName', x: 24, y: 32}
    ])
    expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
    expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(true)
    expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
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
  await scene.linkEnd.reorderMapDataPathWithoutRender(scene.outerBox)

  expect(scene.linkEndData.path.length).toBe(1)
  expect(scene.linkEndData.path).toEqual([
      {boxId: 'outerBoxId', boxName: 'outerBoxIdName', x: 75, y: 25}
  ])
  expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
  expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
  expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
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
  await scene.linkEnd.reorderMapDataPathWithoutRender(scene.rootBox)

  expect(scene.linkEndData.path.length).toBe(1)
  expect(scene.linkEndData.path).toEqual([
      {boxId: 'rootBoxId', boxName: 'fakeProjectSettingsFilePath/fakeSrcRootPath', x: 90, y: 60}
  ])
  expect(scene.rootBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
  expect(scene.outerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
  expect(scene.innerBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
  expect(scene.deepBox.borderingLinks.includes(scene.linkEnd.getReferenceLink())).toBe(false)
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
    const wayPoint = WayPointData.buildNew('managingBoxId', 'managingBoxName', 75, 50)
    const linkEndData = new LinkEndData([wayPoint])

    const managingBox: RootFolderBox = boxFactory.rootFolderOf('managingBoxId')

    const linkEnd = linkEndFactory.renderedOf(linkEndData, managingBox, [managingBox])

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
    const boxMapLinkData = new BoxMapLinkData('linkId', scene.linkEndData, scene.linkEndData)
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
    const innerWayPoint = WayPointData.buildNew('innerBoxId', 'innerBoxName', 50, 50)
    const deepWayPoint = WayPointData.buildNew('deepBoxId', 'deepBoxName', 50, 50)
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
