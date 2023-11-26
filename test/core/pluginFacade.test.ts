import { mock } from 'jest-mock-extended';
import { RootFolderBox } from '../../src/core/box/RootFolderBox'
import { FolderBox } from '../../src/core/box/FolderBox'
import { FileBox } from '../../src/core/box/FileBox'
import { Map } from '../../src/core/Map'
import * as map from '../../src/core/Map'
import { FileBoxDepthTreeIterator } from '../../src/pluginFacade'
import * as pluginFacade from '../../src/pluginFacade'
import * as boxFactory from './box/factories/boxFactory'
import * as testUtil from '../testUtil'

test('getFileBoxIterator', async () => {
  setupScenario()

  const fileBoxes: FileBoxDepthTreeIterator = pluginFacade.getFileBoxIterator()
  expect(await fileBoxes.hasNextOrUnwatch()).toEqual(true)
  expect((await fileBoxes.next()).getId()).toEqual('flatFile')
  expect(await fileBoxes.hasNextOrUnwatch()).toEqual(true)
  expect((await fileBoxes.next()).getId()).toEqual('deepFile')
  expect(await fileBoxes.hasNextOrUnwatch()).toEqual(false)
})

function setupScenario(): void {
  testUtil.initGeneralServicesWithMocks()
  
  const rootFolder = buildFolderTree()
  const mapMock = mock<Map>()
  mapMock.getRootFolder.mockReturnValue(rootFolder)
  map.setMap(mapMock)
}

function buildFolderTree(): RootFolderBox {
  const rootFolder = boxFactory.rootFolderOf({idOrSettings: 'rootFolder'})
  rootFolder.render = () => Promise.resolve()
  rootFolder.body.render = () => Promise.resolve()

  const folder1: FolderBox = boxFactory.folderOf({idOrData: 'folder1', parent: rootFolder, addToParent: true})
  folder1.render = () => Promise.resolve()
  folder1.body.render = () => Promise.resolve()
  const deepFile: FileBox = boxFactory.fileOf({idOrData: 'deepFile', parent: folder1, addToParent: true})

  const flatFile: FileBox = boxFactory.fileOf({idOrData: 'flatFile', parent: rootFolder, addToParent: true})

  const folder2: FolderBox = boxFactory.folderOf({idOrData: 'folder2', parent: rootFolder, addToParent: true})
  folder2.render = () => Promise.resolve()
  folder2.body.render = () => Promise.resolve()

  return rootFolder
}
