import { MockProxy, mock } from 'jest-mock-extended'
import { BoxMapLinkData } from '../../src/box/BoxMapLinkData'
import { WayPointData } from '../../src/box/WayPointData'
import { Box } from '../../src/box/Box'
import { FolderBox } from '../../src/box/FolderBox'
import { Link } from '../../src/link/Link'
import { ClientRect } from '../../src/ClientRect'
import { DocumentObjectModelAdapter, init as initDomAdapter } from '../../src/domAdapter'
import { RenderManager, init as initRenderManager } from '../../src/RenderManager'
import { Transform } from '../../src/box/Transform'
import { LinkEndData } from '../../src/box/LinkEndData'
import { BoxMapData } from '../../src/box/BoxMapData'
import { RootFolderBox } from '../../src/box/RootFolderBox'
import { ProjectSettings } from '../../src/ProjectSettings'
import { fileSystem } from '../../src/fileSystemAdapter'
import { util } from '../../src/util'
import { BoxManager, init as initBoxManager } from '../../src/box/BoxManager'
import { MapSettingsData } from '../../src/mapData/MapSettingsData'

test('render', async () => {
  const scenario = setupSimpleScenario()

  await scenario.link.render()

  //expect(scenario.renderMan.setContentTo).toHaveBeenCalledWith('link', any())) // TODO: make something like this work
  expect(scenario.renderMan.setContentTo).toHaveBeenCalledWith('link', '<svg id="linksvg"><line id="linkLine" x1="15%" y1="10%" x2="85%" y2="10%" class="highlightTransition" style="stroke:#2060c0;stroke-width:2px;pointer-events:auto;"/></svg><div id="linkfrom" draggable="true" class="highlightTransition"></div><div id="linkto" draggable="true" class="highlightTransition"></div>', 1)
  expect(scenario.renderMan.setStyleTo).toHaveBeenCalledWith('linksvg', 'position:absolute;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;', 1)
  //expect(scenario.fromBox.registerBorderingLink).toHaveBeenCalledWith(scenario.link) // TODO: fix jest-mock-extended
  //expect(scenario.toBox.registerBorderingLink).toHaveBeenCalledWith(scenario.link)
  expect(scenario.renderMan.setStyleTo).toHaveBeenCalledWith('linkfrom', 'position:absolute;left:15%;top:10%;width:10px;height:10px;background-color:#2060c0;transform:translate(-5px,-5px);')
  //expect(dragManager.addDraggable).toHaveBeenCalledWith(to) // TODO: mock dragManager
  expect(scenario.renderMan.setStyleTo).toHaveBeenCalledWith('linkto', 'position:absolute;left:85%;top:10%;width:28px;height:10px;background-color:#2060c0;clip-path:polygon(0% 0%, 55% 50%, 0% 100%);transform:translate(-14px,-5px)rotate(0rad);')
  //expect(dragManager.addDraggable).toHaveBeenCalledWith(from) // TODO: mock dragManager
})

test('reorderAndSave not rendered yet', async () => {
  const scenario = setupSimpleScenario()
  const logWarning = jest.fn()
  util.logWarning = logWarning

  await scenario.link.reorderAndSave()

  expect(logWarning).toHaveBeenCalledWith('LinkEnd should be rendered before calling getRenderedTarget() or renderedTarget should be set in constructor, but was not.')
})

test('reorderAndSave', async () => {
  const scenario = setupSimpleScenario()
  await scenario.link.render()

  await scenario.link.reorderAndSave()

  const linkData: BoxMapLinkData = scenario.link.getData()
  expect(linkData.from.path).toHaveLength(1)
  expect(linkData.from.path[0].boxId).toEqual('fromBox')
  expect(linkData.from.path[0].x).toEqual(50)
  expect(linkData.from.path[0].y).toEqual(50)
  expect(linkData.to.path).toHaveLength(1)
  expect(linkData.to.path[0].boxId).toEqual('toBox')
  expect(linkData.to.path[0].x).toEqual(50)
  expect(linkData.to.path[0].y).toEqual(50)
  //expect(scenario.managingBox.saveMapData).toHaveBeenCalled() // TODO: fix jest-mock-extended
})

function setupSimpleScenario(): {
  link: Link,
  managingBox: Box
  fromBox: Box,
  toBox: Box,
  renderMan: MockProxy<RenderManager>
} {
  const fromWayPoints: WayPointData[] = [WayPointData.buildNew('fromBox', 'FromBox', 50, 50)]
  const toWayPoints: WayPointData[] = [WayPointData.buildNew('toBox', 'ToBox', 50, 50)]
  const linkData: BoxMapLinkData = new BoxMapLinkData('link', new LinkEndData(fromWayPoints), new LinkEndData(toWayPoints))

  //const managingBox: MockProxy<FolderBox> = mock<FolderBox>() // TODO: fix jest-mock-extended
  //const fromBox: MockProxy<Box> = mock<Box>()
  //const toBox: MockProxy<Box> = (() => mock<Box>())()
  const projectSettings: ProjectSettings = new ProjectSettings(ProjectSettings.preferredFileName, new MapSettingsData('src', 'map'))
  const managingBox: FolderBox = new RootFolderBox(projectSettings, 'map', BoxMapData.buildNewWithId('managingBox', 0, 0, 100, 100), false)
  const fromBox: Box = new FolderBox('FromBox', managingBox, BoxMapData.buildNewWithId('fromBox', 5, 5, 10, 10), false)
  const toBox: Box = new FolderBox('ToBox', managingBox, BoxMapData.buildNewWithId('toBox', 85, 5, 10, 10), false)

  Object.defineProperty(managingBox, 'transform', {value: new Transform(managingBox)})
  managingBox.getClientRect = () => Promise.resolve(new ClientRect(0, 0, 100, 100))
  managingBox.getBox = (id: string) => {
    if (id === 'fromBox') {
      return fromBox
    }
    if (id === 'toBox') {
      return toBox
    }
    return undefined
  }

  const domAdapter: MockProxy<DocumentObjectModelAdapter> = mock<DocumentObjectModelAdapter>()
  initDomAdapter(domAdapter)

  const renderMan: MockProxy<RenderManager> = mock<RenderManager>()
  initRenderManager(renderMan)

  const boxManager: MockProxy<BoxManager> = mock<BoxManager>()
  initBoxManager(boxManager)

  fileSystem.saveToJsonFile = (_filePath, _object) => Promise.resolve()

  util.logInfo = () => {}

  return {
    link: Link.new(linkData, managingBox),
    managingBox: managingBox,
    fromBox: fromBox,
    toBox: toBox,
    renderMan: renderMan
  }
}
