import { MockProxy, mock } from 'jest-mock-extended'
import { LinkData } from '../../../src/core/mapData/LinkData'
import { WayPointData } from '../../../src/core/mapData/WayPointData'
import { Box } from '../../../src/core/box/Box'
import { Link } from '../../../src/core/link/Link'
import { ClientRect } from '../../../src/core/ClientRect'
import { DocumentObjectModelAdapter, init as initDomAdapter } from '../../../src/core/domAdapter'
import { RenderManager, init as initRenderManager } from '../../../src/core/RenderManager'
import { Transform } from '../../../src/core/box/Transform'
import { LinkEndData } from '../../../src/core/mapData/LinkEndData'
import { BoxData } from '../../../src/core/mapData/BoxData'
import { ProjectSettings } from '../../../src/core/ProjectSettings'
import { FileSystemAdapter, init as initFileSystemAdapter } from '../../../src/core/fileSystemAdapter'
import { util } from '../../../src/core/util/util'
import { BoxManager, init as initBoxManager } from '../../../src/core/box/BoxManager'
import { MapSettingsData } from '../../../src/core/mapData/MapSettingsData'
import * as boxFactory from '../box/factories/boxFactory'
import { RootFolderBox } from '../../../src/pluginFacade'

test('render', async () => {
  const scenario = setupSimpleScenario()

  await scenario.link.render()

  expect(scenario.renderMan.setContentTo).toHaveBeenCalledWith('link', expect.anything(), 1)
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

  const linkData: LinkData = scenario.link.getData()
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
  const linkData: LinkData = new LinkData('link', new LinkEndData(fromWayPoints), new LinkEndData(toWayPoints))

  const mapSettingsData: MapSettingsData = new MapSettingsData({
    id: 'managingBox',
    x: 0, y: 0, width: 100, height: 100,
    links: [],
    nodes: [],
    srcRootPath: 'src',
    mapRootPath: 'map',
    linkTags: []
  })
  const projectSettings: ProjectSettings = new ProjectSettings(ProjectSettings.preferredFileName, mapSettingsData, false)
  const managingBox: RootFolderBox = boxFactory.rootFolderOf({idOrProjectSettings: projectSettings, rendered: true})
  const fromBox: Box = boxFactory.folderOf({idOrData: BoxData.buildNewWithId('fromBox', 5, 5, 10, 10), name: 'FromBox', parent: managingBox, rendered: true})
  const toBox: Box = boxFactory.folderOf({idOrData: BoxData.buildNewWithId('toBox', 85, 5, 10, 10), name: 'ToBox', parent: managingBox, rendered: true})

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
  managingBox.isBodyBeingRendered = () => true

  const domAdapter: MockProxy<DocumentObjectModelAdapter> = mock<DocumentObjectModelAdapter>()
  initDomAdapter(domAdapter)

  const renderMan: MockProxy<RenderManager> = mock<RenderManager>()
  initRenderManager(renderMan)

  const boxManager: MockProxy<BoxManager> = mock<BoxManager>()
  initBoxManager(boxManager)

  const fileSystemAdapter: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
  fileSystemAdapter.saveToJsonFile.mockReturnValue(Promise.resolve())
  initFileSystemAdapter(fileSystemAdapter)

  util.logInfo = () => {}

  return {
    link: Link.new(linkData, managingBox),
    managingBox: managingBox,
    fromBox: fromBox,
    toBox: toBox,
    renderMan: renderMan
  }
}
