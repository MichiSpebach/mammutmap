import { MockProxy, mock } from 'jest-mock-extended';
import { RootFolderBox } from '../src/box/RootFolderBox'
import { FolderBox } from '../src/box/FolderBox'
import { FileBox } from '../src/box/FileBox'
import { Map } from '../src/Map'
import * as map from '../src/Map'
import { FileBoxDepthTreeIterator } from '../src/pluginFacade'
import * as pluginFacade from '../src/pluginFacade'

test('getFileBoxIterator', async () => {
  setupScenario()

  const fileBoxes: FileBoxDepthTreeIterator = pluginFacade.getFileBoxIterator()
  expect(await fileBoxes.hasNext()).toEqual(true)
  expect((await fileBoxes.next()).getId()).toEqual('flatFile')
  expect(await fileBoxes.hasNext()).toEqual(true)
  expect((await fileBoxes.next()).getId()).toEqual('deepFile')
  expect(await fileBoxes.hasNext()).toEqual(false)
})

function setupScenario(): void {
  const rootFolder = buildFolderTree()
  const mapMock = mock<Map>()
  mapMock.getRootFolder.mockReturnValue(rootFolder)
  map.setMap(mapMock)
}

function buildFolderTree(): RootFolderBox {
  const file1 = mockFileBox()
  file1.getId.mockReturnValue('deepFile')
  const folder1 = mockFolderBox()
  folder1.getBoxes.mockReturnValue([file1])

  const file2 = mockFileBox()
  file2.getId.mockReturnValue('flatFile')

  const folder2 = mockFolderBox()
  folder2.getBoxes.mockReturnValue([])

  const rootFolder = mockRootFolderBox()
  rootFolder.getBoxes.mockReturnValue([folder1, file2, folder2])

  return rootFolder
}

function mockFileBox(): MockProxy<FileBox> {
  const file: MockProxy<FileBox> = mock<FileBox>()
  file.isFolder.mockReturnValue(false)
  file.isFile.mockReturnValue(true)
  return file
}

function mockFolderBox(): MockProxy<FolderBox> {
  const file: MockProxy<FolderBox> = mock<FolderBox>()
  file.isFolder.mockReturnValue(true)
  file.isFile.mockReturnValue(false)
  return file
}

function mockRootFolderBox(): MockProxy<RootFolderBox> {
  return mockFolderBox() as MockProxy<RootFolderBox>
}
