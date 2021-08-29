import { MockProxy, mock } from 'jest-mock-extended';
import { BoxMapLinkData } from '../../src/box/BoxMapLinkData'
import { WayPointData } from '../../src/box/WayPointData'
import { Box } from '../../src/box/Box'
import { FolderBox } from '../../src/box/FolderBox'
import { Link } from '../../src/box/Link';
import { Rect } from '../../src/Rect';
import { BoxManager, init as initBoxManager } from '../../src/box/BoxManager'
import { DocumentObjectModelAdapter, init as initDomAdapter } from '../../src/domAdapter'
import { RenderManager, init as initRenderManager } from '../../src/RenderManager'

test('render', async () => {
  const scenario = setupSimpleScenario()

  await scenario.link.render()

  //expect(domAdapter.addContentTo).toHaveBeenCalledWith('managingBox', any())) // TODO: make something like this work
  expect(scenario.renderMan.addContentTo).toHaveBeenCalledWith('managingBox', '<div id="link"><svg id="linksvg"><line id="linkline" x1="10%" y1="10%" x2="90%" y2="10%" style="stroke:#2060c0;stroke-width:2px;"/></svg><div id="linkfrom" draggable="true"></div><div id="linkto" draggable="true"></div></div>')
  expect(scenario.renderMan.setStyleTo).toHaveBeenCalledWith('linksvg', 'position:absolute;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;')
  expect(scenario.fromBox.registerBorderingLink).toHaveBeenCalledWith(scenario.link)
  expect(scenario.toBox.registerBorderingLink).toHaveBeenCalledWith(scenario.link)
  expect(scenario.renderMan.setStyleTo).toHaveBeenCalledWith('linkfrom', 'position:absolute;left:10%;top:10%;width:10px;height:10px;background-color:#2060c0;transform:translate(-5px,-5px);')
  //expect(dragManager.addDraggable).toHaveBeenCalledWith(to) // TODO: mock dragManager
  expect(scenario.renderMan.setStyleTo).toHaveBeenCalledWith('linkto', 'position:absolute;left:90%;top:10%;width:28px;height:10px;background-color:#2060c0;clip-path:polygon(0% 0%, 55% 50%, 0% 100%);transform:translate(-14px,-5px)rotate(0rad);')
  //expect(dragManager.addDraggable).toHaveBeenCalledWith(from) // TODO: mock dragManager
})

test('reorderAndSave not rendered yet', async () => {
  const scenario = setupSimpleScenario()

  await expect(scenario.link.reorderAndSave()).rejects.toThrowError('WayPoint must be rendered before calling getBorderingBox(), but was not.')
})

test('reorderAndSave without any changes', async () => {
  const scenario = setupSimpleScenario()
  await scenario.link.render()

  scenario.renderMan.getClientRectOf.calledWith('linkfrom').mockReturnValue(Promise.resolve(new Rect(5, 5, 10, 10)))
  scenario.renderMan.getClientRectOf.calledWith('linkto').mockReturnValue(Promise.resolve(new Rect(85, 5, 10, 10)))
  scenario.fromBox.transformClientPositionToLocal.calledWith(10, 10).mockReturnValue(Promise.resolve({x: 50, y: 50}))
  scenario.toBox.transformClientPositionToLocal.calledWith(90, 10).mockReturnValue(Promise.resolve({x: 50, y: 50}))

  await scenario.link.reorderAndSave()

  const linkData: BoxMapLinkData = scenario.link.getData()
  expect(linkData.fromWayPoints).toHaveLength(1)
  expect(linkData.fromWayPoints[0].boxId).toEqual('fromBox')
  expect(linkData.fromWayPoints[0].x).toEqual(50)
  expect(linkData.fromWayPoints[0].y).toEqual(50)
  expect(linkData.toWayPoints).toHaveLength(1)
  expect(linkData.toWayPoints[0].boxId).toEqual('toBox')
  expect(linkData.toWayPoints[0].x).toEqual(50)
  expect(linkData.toWayPoints[0].y).toEqual(50)
  expect(scenario.managingBox.saveMapData).toHaveBeenCalled()
})

test('reorderAndSave linkEnds moved (to edges)', async () => {
  const scenario = setupSimpleScenario()
  await scenario.link.render()

  scenario.renderMan.getClientRectOf.calledWith('linkfrom').mockReturnValue(Promise.resolve(new Rect(15, 5, 10, 10)))
  scenario.renderMan.getClientRectOf.calledWith('linkto').mockReturnValue(Promise.resolve(new Rect(75, 5, 10, 10)))
  scenario.fromBox.transformClientPositionToLocal.calledWith(20, 10).mockReturnValue(Promise.resolve({x: 100, y: 50}))
  scenario.toBox.transformClientPositionToLocal.calledWith(80, 10).mockReturnValue(Promise.resolve({x: 0, y: 50}))
  scenario.managingBox.transformInnerCoordsRecursiveToLocal.calledWith(scenario.fromBox, 100, 50).mockReturnValue({x: 20, y: 10})
  scenario.managingBox.transformInnerCoordsRecursiveToLocal.calledWith(scenario.toBox, 0, 50).mockReturnValue({x: 80, y: 10})

  await scenario.link.reorderAndSave()

  const linkData: BoxMapLinkData = scenario.link.getData()
  expect(linkData.fromWayPoints).toHaveLength(1)
  expect(linkData.fromWayPoints[0].boxId).toEqual('fromBox')
  expect(linkData.fromWayPoints[0].x).toEqual(100)
  expect(linkData.fromWayPoints[0].y).toEqual(50)
  expect(linkData.toWayPoints).toHaveLength(1)
  expect(linkData.toWayPoints[0].boxId).toEqual('toBox')
  expect(linkData.toWayPoints[0].x).toEqual(0)
  expect(linkData.toWayPoints[0].y).toEqual(50)
  expect(scenario.managingBox.saveMapData).toHaveBeenCalled()
})

function setupSimpleScenario(): {
  link: Link,
  managingBox: MockProxy<Box>
  fromBox: MockProxy<Box>,
  toBox: MockProxy<Box>,
  renderMan: MockProxy<RenderManager>
} {
  const fromWayPoints: WayPointData[] = [new WayPointData('fromBox', 'FromBox', 50, 50)]
  const toWayPoints: WayPointData[] = [new WayPointData('toBox', 'ToBox', 50, 50)]
  const linkData: BoxMapLinkData = new BoxMapLinkData('link', fromWayPoints, toWayPoints)

  const managingBox: MockProxy<FolderBox> = mock<FolderBox>();
  const fromBox: MockProxy<Box> = mock<Box>();
  const toBox: MockProxy<Box> = mock<Box>();

  managingBox.getId.mockReturnValue('managingBox')
  managingBox.transformInnerCoordsRecursiveToLocal.calledWith(fromBox, 50, 50).mockReturnValue({x: 10, y: 10})
  managingBox.transformInnerCoordsRecursiveToLocal.calledWith(toBox, 50, 50).mockReturnValue({x: 90, y: 10})

  fromBox.getId.mockReturnValue('fromBox')
  fromBox.getName.mockReturnValue('FromBox')
  fromBox.getParent.mockReturnValue(managingBox)

  toBox.getId.mockReturnValue('toBox')
  toBox.getName.mockReturnValue('ToBox')
  toBox.getParent.mockReturnValue(managingBox)

  const boxManager: MockProxy<BoxManager> = mock<BoxManager>()
  boxManager.getBoxIfExists.calledWith('fromBox').mockReturnValue(fromBox)
  boxManager.getBoxIfExists.calledWith('toBox').mockReturnValue(toBox)
  initBoxManager(boxManager)

  const domAdapter: MockProxy<DocumentObjectModelAdapter> = mock<DocumentObjectModelAdapter>()
  initDomAdapter(domAdapter)

  const renderMan: MockProxy<RenderManager> = mock<RenderManager>()
  initRenderManager(renderMan)

  return {
    link: new Link(linkData, managingBox),
    managingBox: managingBox,
    fromBox: fromBox,
    toBox: toBox,
    renderMan: renderMan
  }
}
