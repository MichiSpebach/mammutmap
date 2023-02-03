import { mock, MockProxy } from 'jest-mock-extended'
import { Dirent } from 'fs'
import { FileSystemAdapter, init as initFileSystem } from '../../../src/core/fileSystemAdapter'
import { BoxMapDataLoader } from '../../../src/core/box/BoxMapDataLoader'
import { FolderBox } from '../../../src/core/box/FolderBox'
import { FolderBoxBody } from '../../../src/core/box/FolderBoxBody'
import { BoxData } from '../../../src/core/mapData/BoxData'
import { util } from '../../../src/core/util'
import { BoxManager, init as initBoxManager } from '../../../src/core/box/BoxManager'
import { Box } from '../../../src/core/box/Box'

const actualLogWarning: (message: string) => void = util.logWarning

beforeEach(() => { // TODO: use something like expect(<mock>).noFurtherCalls() in afterAll()
    // reset logWarning in case that a test mocked and overwrote it to prevent unexpected warnings to be suppressed
    util.logWarning = actualLogWarning
})

test('loadDirents sourcesWithoutMapData', async () => {
  const sourceDirent1: Dirent = buildDirentMock('dirent1')
  const sourceDirent2: Dirent = buildDirentMock('dirent2')

  const scenario = setupScenarioForLoadDirents([sourceDirent1, sourceDirent2], [])

  const result = await scenario.loader.loadDirents()

  expect(result.sourcesWithoutMapData).toEqual([sourceDirent1, sourceDirent2])
  expect(result.mapDataWithoutSources).toEqual([])
  expect(result.sourcesWithMapData).toEqual([])
})

test('loadDirents mapDataWithoutSources', async () => {
  const mapDirent1: Dirent = buildFileDirentMock('dirent1.json')
  const mapDirent2: Dirent = buildFileDirentMock('dirent2.json')

  const scenario = setupScenarioForLoadDirents([], [mapDirent1, mapDirent2])

  const result = await scenario.loader.loadDirents()

  expect(result.sourcesWithoutMapData).toEqual([])
  expect(result.mapDataWithoutSources).toEqual([mapDirent1, mapDirent2])
  expect(result.sourcesWithMapData).toEqual([])
})

test('loadDirents sourcesWithMapData', async () => {
  const sourceDirent1: Dirent = buildDirentMock('dirent1')
  const sourceDirent2: Dirent = buildDirentMock('dirent2')
  const mapDirent1: Dirent = buildFileDirentMock('dirent1.json')
  const mapDirent2: Dirent = buildFileDirentMock('dirent2.json')

  const scenario = setupScenarioForLoadDirents([sourceDirent1, sourceDirent2], [mapDirent1, mapDirent2])

  const result = await scenario.loader.loadDirents()

  expect(result.sourcesWithoutMapData).toEqual([])
  expect(result.mapDataWithoutSources).toEqual([])
  expect(result.sourcesWithMapData).toEqual([
    {source: sourceDirent1, map: mapDirent1},
    {source: sourceDirent2, map: mapDirent2}
  ])
})

test('loadDirents mixed', async () => {
  const sourceDirent1: Dirent = buildDirentMock('dirent1')
  const sourceDirent2: Dirent = buildDirentMock('dirent2')
  const mapDirent2: Dirent = buildFileDirentMock('dirent2.json')
  const mapDirent3: Dirent = buildFileDirentMock('dirent3.json')

  const scenario = setupScenarioForLoadDirents([sourceDirent1, sourceDirent2], [mapDirent2, mapDirent3])

  const result = await scenario.loader.loadDirents()

  expect(result.sourcesWithoutMapData).toEqual([sourceDirent1])
  expect(result.mapDataWithoutSources).toEqual([mapDirent3])
  expect(result.sourcesWithMapData).toEqual([
    {source: sourceDirent2, map: mapDirent2}
  ])
})

test('loadDirents mapFolder contains not only files', async () => {
  const mapDirent1: MockProxy<Dirent> = buildDirentMock('dirent1')
  mapDirent1.isFile.mockReturnValue(false)
  const mapDirent2: Dirent = buildFileDirentMock('dirent2.json')

  const scenario = setupScenarioForLoadDirents([], [mapDirent1, mapDirent2])

  const result = await scenario.loader.loadDirents()

  expect(result.sourcesWithoutMapData).toEqual([])
  expect(result.mapDataWithoutSources).toEqual([mapDirent2])
  expect(result.sourcesWithMapData).toEqual([])
})

test('loadMapDatasOfSourcesWithMapData', async () => {
  const sourceDirent1: MockProxy<Dirent> = buildDirentMock('dirent1')
  const sourceDirent2: MockProxy<Dirent> = buildDirentMock('dirent2')
  const mapDirent1: MockProxy<Dirent> = buildDirentMock('dirent1.json')
  const mapDirent2: MockProxy<Dirent> = buildDirentMock('dirent2.json')
  const boxDataDirent1: BoxData = buildBoxData('dirent1')
  const boxDataDirent2: BoxData = buildBoxData('dirent2')

  const fileSystem: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent1.json', expect.anything()).mockReturnValue(Promise.resolve(boxDataDirent1))
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent2.json', expect.anything()).mockReturnValue(Promise.resolve(boxDataDirent2))
  initFileSystem(fileSystem)

  const referenceBox: FolderBox = mock<FolderBox>()
  referenceBox.getMapPath = () => 'mapPath'
  const referenceBoxBody: FolderBoxBody = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName = () => false

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = await loader.loadMapDatasOfSourcesWithMapData([
    { source: sourceDirent1, map: mapDirent1 },
    { source: sourceDirent2, map: mapDirent2 }
  ])

  expect(result).toEqual({
    sourcesWithLoadedMapData: [
      {source: sourceDirent1, mapData: boxDataDirent1},
      {source: sourceDirent2, mapData: boxDataDirent2}
    ],
    sourcesWithLoadingFailedMapData: []
  })
})

test('loadMapDatasOfSourcesWithMapData referenceBox contains already a box', async () => {
  const sourceDirent1: MockProxy<Dirent> = buildDirentMock('dirent1')
  const sourceDirent2: MockProxy<Dirent> = buildDirentMock('dirent2')
  const mapDirent1: MockProxy<Dirent> = buildDirentMock('dirent1.json')
  const mapDirent2: MockProxy<Dirent> = buildDirentMock('dirent2.json')
  const boxDataDirent2: BoxData = buildBoxData('dirent2')

  const fileSystem: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent2.json', expect.anything()).mockReturnValue(Promise.resolve(boxDataDirent2))
  initFileSystem(fileSystem)

  const referenceBox: FolderBox = mock<FolderBox>()
  referenceBox.getMapPath = () => 'mapPath'
  const referenceBoxBody: MockProxy<FolderBoxBody> = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName.calledWith('dirent1').mockReturnValue(true)
  referenceBoxBody.containsBoxByName.calledWith('dirent2').mockReturnValue(false)

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = await loader.loadMapDatasOfSourcesWithMapData([
    { source: sourceDirent1, map: mapDirent1 },
    { source: sourceDirent2, map: mapDirent2 }
  ])

  expect(result).toEqual({
    sourcesWithLoadedMapData: [{source: sourceDirent2, mapData: boxDataDirent2}],
    sourcesWithLoadingFailedMapData: []
  })
  expect(referenceBoxBody.containsBoxByName).toBeCalledTimes(2)
  expect(fileSystem.loadFromJsonFile).toBeCalledTimes(1)
})

test('loadMapDatasOfSourcesWithMapData loading of a mapData fails', async () => {
  const sourceDirent1: MockProxy<Dirent> = buildDirentMock('dirent1')
  const sourceDirent2: MockProxy<Dirent> = buildDirentMock('dirent2')
  const mapDirent1: MockProxy<Dirent> = buildDirentMock('dirent1.json')
  const mapDirent2: MockProxy<Dirent> = buildDirentMock('dirent2.json')
  const boxDataDirent1: BoxData = buildBoxData('dirent1')

  const fileSystem: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent1.json', expect.anything()).mockReturnValue(Promise.resolve(boxDataDirent1))
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent2.json', expect.anything()).mockReturnValue(Promise.resolve(null))
  initFileSystem(fileSystem)

  const referenceBox: FolderBox = mock<FolderBox>()
  referenceBox.getMapPath = () => 'mapPath'
  const referenceBoxBody: FolderBoxBody = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName = () => false

  const logWarning = jest.fn()
  util.logWarning = logWarning

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = await loader.loadMapDatasOfSourcesWithMapData([
    { source: sourceDirent1, map: mapDirent1 },
    { source: sourceDirent2, map: mapDirent2 }
  ])

  expect(logWarning).toBeCalledWith('failed to load mapData in mapPath/dirent2.json')
  expect(result).toEqual({
    sourcesWithLoadedMapData: [{source: sourceDirent1, mapData: boxDataDirent1}],
    sourcesWithLoadingFailedMapData: [sourceDirent2]
  })
})

test('filterSourcesWithoutMapData', () => {
  const sourceDirent1: MockProxy<Dirent> = buildDirentMock('dirent1')
  const sourceDirent2: MockProxy<Dirent> = buildDirentMock('dirent2')

  const referenceBox: FolderBox = mock<FolderBox>()
  const referenceBoxBody: FolderBoxBody = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName = () => false

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = loader.filterSourcesWithoutMapData([sourceDirent1, sourceDirent2])

  expect(result).toEqual([sourceDirent1, sourceDirent2])
})

test('filterSourcesWithoutMapData referenceBox contains already first box', () => {
  const sourceDirent1: MockProxy<Dirent> = buildDirentMock('dirent1')
  const sourceDirent2: MockProxy<Dirent> = buildDirentMock('dirent2')

  const referenceBox: FolderBox = mock<FolderBox>()
  const referenceBoxBody: MockProxy<FolderBoxBody> = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName.calledWith('dirent1').mockReturnValue(true)
  referenceBoxBody.containsBoxByName.calledWith('dirent2').mockReturnValue(false)

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = loader.filterSourcesWithoutMapData([sourceDirent1, sourceDirent2])

  expect(result).toEqual([sourceDirent2])
})

test('filterSourcesWithoutMapData referenceBox contains already last box', () => {
  const sourceDirent1: MockProxy<Dirent> = buildDirentMock('dirent1')
  const sourceDirent2: MockProxy<Dirent> = buildDirentMock('dirent2')

  const referenceBox: FolderBox = mock<FolderBox>()
  const referenceBoxBody: MockProxy<FolderBoxBody> = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName.calledWith('dirent1').mockReturnValue(false)
  referenceBoxBody.containsBoxByName.calledWith('dirent2').mockReturnValue(true)

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = loader.filterSourcesWithoutMapData([sourceDirent1, sourceDirent2])

  expect(result).toEqual([sourceDirent1])
})

test('filterSourcesWithoutMapData referenceBox contains already both boxes', () => {
  const sourceDirent1: MockProxy<Dirent> = buildDirentMock('dirent1')
  const sourceDirent2: MockProxy<Dirent> = buildDirentMock('dirent2')

  const referenceBox: FolderBox = mock<FolderBox>()
  const referenceBoxBody: MockProxy<FolderBoxBody> = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName.calledWith('dirent1').mockReturnValue(true)
  referenceBoxBody.containsBoxByName.calledWith('dirent2').mockReturnValue(true)

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = loader.filterSourcesWithoutMapData([sourceDirent1, sourceDirent2])

  expect(result).toEqual([])
})

test('filterSourcesWithoutMapData referenceBox contains already first two box', () => {
  const sourceDirent1: MockProxy<Dirent> = buildDirentMock('dirent1')
  const sourceDirent2: MockProxy<Dirent> = buildDirentMock('dirent2')
  const sourceDirent3: MockProxy<Dirent> = buildDirentMock('dirent3')

  const referenceBox: FolderBox = mock<FolderBox>()
  const referenceBoxBody: MockProxy<FolderBoxBody> = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName.calledWith('dirent1').mockReturnValue(true)
  referenceBoxBody.containsBoxByName.calledWith('dirent2').mockReturnValue(true)
  referenceBoxBody.containsBoxByName.calledWith('dirent3').mockReturnValue(false)

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = loader.filterSourcesWithoutMapData([sourceDirent1, sourceDirent2, sourceDirent3])

  expect(result).toEqual([sourceDirent3])
})

test('loadMapDatasWithoutSources', async () => {
  const mapDirent1: MockProxy<Dirent> = buildDirentMock('dirent1.json')
  const mapDirent2: MockProxy<Dirent> = buildDirentMock('dirent2.json')
  const boxDataDirent1: BoxData = buildBoxData('dirent1')
  const boxDataDirent2: BoxData = buildBoxData('dirent2')

  const fileSystem: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent1.json', expect.anything()).mockReturnValue(Promise.resolve(boxDataDirent1))
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent2.json', expect.anything()).mockReturnValue(Promise.resolve(boxDataDirent2))
  initFileSystem(fileSystem)

  const referenceBox: FolderBox = mock<FolderBox>()
  referenceBox.getMapPath = () => 'mapPath'
  const referenceBoxBody: MockProxy<FolderBoxBody> = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName.calledWith('dirent1').mockReturnValue(false)
  referenceBoxBody.containsBoxByName.calledWith('dirent2').mockReturnValue(false)

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = await loader.loadMapDatasWithoutSources([mapDirent1, mapDirent2])

  expect(result).toEqual([
    {boxName: 'dirent1', mapData: boxDataDirent1},
    {boxName: 'dirent2', mapData: boxDataDirent2}
  ])
})

test('loadMapDatasWithoutSources suffix of a file name is invalid', async () => {
  const mapDirent1: MockProxy<Dirent> = buildDirentMock('dirent1.invalid')
  const mapDirent2: MockProxy<Dirent> = buildDirentMock('dirent2.json')
  const boxDataDirent2: BoxData = buildBoxData('dirent2')

  const fileSystem: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent1.invalid', expect.anything()).mockReturnValue(Promise.resolve(null))
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent2.json', expect.anything()).mockReturnValue(Promise.resolve(boxDataDirent2))
  initFileSystem(fileSystem)

  const referenceBox: FolderBox = mock<FolderBox>()
  referenceBox.getMapPath = () => 'mapPath'
  const referenceBoxBody: MockProxy<FolderBoxBody> = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName.calledWith('dirent1.in').mockReturnValue(false)
  referenceBoxBody.containsBoxByName.calledWith('dirent2').mockReturnValue(false)

  const logWarning = jest.fn()
  util.logWarning = logWarning

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = await loader.loadMapDatasWithoutSources([mapDirent1, mapDirent2])

  expect(logWarning).toBeCalledWith('expected map file to have .json suffix, map file is dirent1.invalid')
  expect(logWarning).toBeCalledWith('failed to load mapData in mapPath/dirent1.invalid')
  expect(result).toEqual([{boxName: 'dirent2', mapData: boxDataDirent2}])
})

test('loadMapDatasWithoutSources referenceBox contains already a box', async () => {
  const mapDirent1: MockProxy<Dirent> = buildDirentMock('dirent1.json')
  const mapDirent2: MockProxy<Dirent> = buildDirentMock('dirent2.json')
  const boxDataDirent2: BoxData = buildBoxData('dirent2')

  const fileSystem: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent2.json', expect.anything()).mockReturnValue(Promise.resolve(boxDataDirent2))
  initFileSystem(fileSystem)

  const referenceBox: FolderBox = mock<FolderBox>()
  referenceBox.getMapPath = () => 'mapPath'
  const referenceBoxBody: MockProxy<FolderBoxBody> = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName.calledWith('dirent1').mockReturnValue(true)
  referenceBoxBody.containsBoxByName.calledWith('dirent2').mockReturnValue(false)

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = await loader.loadMapDatasWithoutSources([mapDirent1, mapDirent2])

  expect(result).toEqual([{boxName: 'dirent2', mapData: boxDataDirent2}])
  expect(referenceBoxBody.containsBoxByName).toBeCalledTimes(2)
  expect(fileSystem.loadFromJsonFile).toBeCalledTimes(1)
})

test('loadMapDatasWithoutSources boxId is already used by another box', async () => {
  const mapDirent1: MockProxy<Dirent> = buildDirentMock('dirent1.json')
  const mapDirent2: MockProxy<Dirent> = buildDirentMock('dirent2.json')
  const boxDataDirent1: BoxData = buildBoxData('dirent1')
  const boxDataDirent2: BoxData = buildBoxData('dirent2')

  const fileSystem: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent1.json', expect.anything()).mockReturnValue(Promise.resolve(boxDataDirent1))
  fileSystem.loadFromJsonFile.calledWith('mapPath/dirent2.json', expect.anything()).mockReturnValue(Promise.resolve(boxDataDirent2))
  initFileSystem(fileSystem)

  const referenceBox: FolderBox = mock<FolderBox>()
  referenceBox.getMapPath = () => 'mapPath'
  const referenceBoxBody: MockProxy<FolderBoxBody> = mock<FolderBoxBody>()
  referenceBoxBody.containsBoxByName.calledWith('dirent1').mockReturnValue(false)
  referenceBoxBody.containsBoxByName.calledWith('dirent2').mockReturnValue(false)

  const boxManager: MockProxy<BoxManager> = mock<BoxManager>()
  boxManager.getBoxIfExists.calledWith(boxDataDirent1.id).mockReturnValue(mock<Box>())
  boxManager.getBoxIfExists.calledWith(boxDataDirent2.id).mockReturnValue(undefined)
  initBoxManager(boxManager)

  const logWarning = jest.fn()
  util.logWarning = logWarning

  const loader: BoxMapDataLoader = new BoxMapDataLoader(referenceBox, referenceBoxBody)
  const result = await loader.loadMapDatasWithoutSources([mapDirent1, mapDirent2])

  expect(logWarning).toBeCalledWith('skipping mapPath/dirent1.json because its id dirent1BoxId is already in use by another box')
  expect(result).toEqual([{boxName: 'dirent2', mapData: boxDataDirent2}])
})

function setupScenarioForLoadDirents(sourceDirents: Dirent[], mapDirents: Dirent[]): {
  loader: BoxMapDataLoader
} {
  const fileSystem: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
  fileSystem.readdir.calledWith('sourcePath').mockReturnValue(Promise.resolve(sourceDirents))
  fileSystem.readdir.calledWith('mapPath').mockReturnValue(Promise.resolve(mapDirents))
  fileSystem.doesDirentExist.calledWith('mapPath').mockReturnValue(Promise.resolve(true))
  initFileSystem(fileSystem)

  const referenceBox: FolderBox = mock<FolderBox>()
  referenceBox.getSrcPath = () => 'sourcePath'
  referenceBox.getMapPath = () => 'mapPath'
  const referenceBoxBody: FolderBoxBody = mock<FolderBoxBody>()
  const loader = new BoxMapDataLoader(referenceBox, referenceBoxBody)

  return {loader}
}

function buildFileDirentMock(name: string): MockProxy<Dirent> {
  const dirent: MockProxy<Dirent> = buildDirentMock(name)
  dirent.isFile.mockReturnValue(true)
  return dirent
}

function buildDirentMock(name: string): MockProxy<Dirent> {
  const dirent: MockProxy<Dirent> = mock<Dirent>()
  dirent.name = name
  return dirent
}

function buildBoxData(idPrefix: string): BoxData {
  return BoxData.buildNewWithId(idPrefix+'BoxId', 40, 40, 20, 20)
}
