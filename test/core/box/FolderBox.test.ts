import { mock } from 'jest-mock-extended'
import { BoxData } from '../../../src/core/mapData/BoxData'
import { FolderBox } from '../../../src/core/box/FolderBox'
import { FileBox } from '../../../src/core/box/FileBox'
import { BoxWatcher } from '../../../src/core/box/BoxWatcher'
import { util } from '../../../src/core/util/util'
import * as mapSettingsDataFactory from '../mapData/factories/mapSettingsDataFactory'
import * as projectSettingsFactory from '../factories/projectSettingsFactory'
import * as boxFactory from './factories/boxFactory'
import { BoxManager, init as initBoxManager } from '../../../src/core/box/BoxManager'
import { ProjectSettings } from '../../../src/core/ProjectSettings'

test('getBoxBySourcePathAndRenderIfNecessary path with one element', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: BoxWatcher|undefined = (await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/innerBox')).boxWatcher
  if (!result) {
    fail()
  }
  expect(await result.get()).toBe(scenario.innerBox)
})

test('getBoxBySourcePathAndRenderIfNecessary path with two elements', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: BoxWatcher|undefined = (await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/innerBox/fileBox')).boxWatcher
  if (!result) {
    fail()
  }
  expect(await result.get()).toBe(scenario.fileBox)
})

test('getBoxBySourcePathAndRenderIfNecessary ignoreFileEndings', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: BoxWatcher|undefined = (await scenario.box.getBoxBySourcePathAndRenderIfNecessary(
    'src/box/innerBox/fileBox.fileEnding', {ignoreFileEndings: true}
  )).boxWatcher
  if (!result) {
    fail()
  }
  expect(await result.get()).toBe(scenario.fileBox)
})

test('getBoxBySourcePathAndRenderIfNecessary invalid path with elements after file', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const logWarning = jest.fn()
  util.logWarning = logWarning

  const result: BoxWatcher|undefined = (await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/innerBox/fileBox/invalid')).boxWatcher

  expect(result).toBe(undefined)
  expect(logWarning).toHaveBeenCalledWith('src/box/innerBox/fileBox is not last element in path innerBox/fileBox/invalid but is not a folder')
})

test('getBoxBySourcePathAndRenderIfNecessary path with not existing element', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const logWarning = jest.fn()
  util.logWarning = logWarning

  const result: BoxWatcher|undefined = (await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/notExisting')).boxWatcher

  expect(result).toBe(undefined)
  expect(logWarning).toHaveBeenCalledWith('src/box/notExisting not found')
})

function setupScenarioForGetBoxBySourcePathAndRenderIfNecessary(): {
  box: FolderBox,
  innerBox: FolderBox,
  fileBox: FileBox
} {
  initBoxManager(new BoxManager())

  const projectSettings: ProjectSettings = projectSettingsFactory.of({
    projectSettingsFilePath: '', 
    data: mapSettingsDataFactory.of({id: 'src/box', srcRootPath: 'src/box'})
  })
  const box: FolderBox = boxFactory.rootFolderOf({idOrSettings: projectSettings})
  const innerBox: FolderBox = boxFactory.folderOf({name: 'innerBox', parent: box, addToParent: false, idOrData: mock<BoxData>()})
  const fileBox: FileBox = boxFactory.fileOf({name: 'fileBox', parent: innerBox, addToParent: false, idOrData: mock<BoxData>()})

  box.getSrcPath = () => 'src/box'
  box.getBoxes = () => [innerBox]
  box.render = () => Promise.resolve()
  innerBox.getBoxes = () => [fileBox]
  innerBox.render = () => Promise.resolve()
  fileBox.render = () => Promise.resolve()

  return {box: box, innerBox: innerBox, fileBox: fileBox}
}
