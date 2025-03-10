import { MockProxy, mock } from 'jest-mock-extended'
import { LinkData } from '../../../src/core/mapData/LinkData'
import { WayPointData } from '../../../src/core/mapData/WayPointData'
import { Box } from '../../../src/core/box/Box'
import { Link } from '../../../src/core/link/Link'
import { ClientRect } from '../../../src/core/ClientRect'
import { RenderManager } from '../../../src/core/renderEngine/renderManager'
import { Transform } from '../../../src/core/box/Transform'
import { LinkEndData } from '../../../src/core/mapData/LinkEndData'
import { BoxData } from '../../../src/core/mapData/BoxData'
import { ProjectSettings } from '../../../src/core/ProjectSettings'
import { FileSystemAdapter, init as initFileSystemAdapter } from '../../../src/core/fileSystemAdapter'
import { util } from '../../../src/core/util/util'
import { MapSettingsData } from '../../../src/core/mapData/MapSettingsData'
import * as boxFactory from '../box/factories/boxFactory'
import { RootFolderBox } from '../../../src/pluginFacade'
import { HoverManager } from '../../../src/core/HoverManager'
import * as testUtil from '../../testUtil'

afterEach(() => {
  (HoverManager as any).hoverables = new Map() // otherwise "WARNING: HoverManager::addHoverable(..) hoverable with id 'link' already exists."
})

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

test('reorderAndSaveAndRender', async () => {
  const scenario = setupSimpleScenario()
  await scenario.link.render()

  await scenario.link.reorderAndSaveAndRender({movedWayPoint: scenario.fromBox})

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
  const mocks = testUtil.initGeneralServicesWithMocks()

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
  const managingBox: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: projectSettings, rendered: true})
  const fromBox: Box = boxFactory.folderOf({idOrData: BoxData.buildNewWithId('fromBox', 5, 5, 10, 10), name: 'FromBox', parent: managingBox, addToParent: false, rendered: true})
  const toBox: Box = boxFactory.folderOf({idOrData: BoxData.buildNewWithId('toBox', 85, 5, 10, 10), name: 'ToBox', parent: managingBox, addToParent: false, rendered: true})

  Object.defineProperty(managingBox, 'transform', {value: new Transform(managingBox)})
  managingBox.getClientRect = () => Promise.resolve(new ClientRect(0, 0, 100, 100))
  managingBox.findChildById = (id: string) => {
    if (id === 'fromBox') {
      return fromBox
    }
    if (id === 'toBox') {
      return toBox
    }
    return undefined
  }
  managingBox.isBodyBeingRendered = () => true

  const fileSystemAdapter: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
  fileSystemAdapter.saveToJsonFile.mockReturnValue(Promise.resolve())
  initFileSystemAdapter(fileSystemAdapter)

  util.logInfo = () => {}

  return {
    link: Link.new(linkData, managingBox),
    managingBox: managingBox,
    fromBox: fromBox,
    toBox: toBox,
    renderMan: mocks.renderManager
  }
}
