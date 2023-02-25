import { mock } from 'jest-mock-extended'
import { BoxData } from '../../../src/core/mapData/BoxData'
import { FolderBox } from '../../../src/core/box/FolderBox'
import { FileBox } from '../../../src/core/box/FileBox'
import { BoxWatcher } from '../../../src/core/box/BoxWatcher'
import { util } from '../../../src/core/util/util'

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
  const box: FolderBox = new FolderBox('src/box', null, mock<BoxData>(), false)
  const innerBox: FolderBox = new FolderBox('innerBox', box, mock<BoxData>(), false)
  const fileBox: FileBox = new FileBox('fileBox', innerBox, mock<BoxData>(), false)

  box.getSrcPath = () => 'src/box'
  box.getBoxes = () => [innerBox]
  box.render = () => Promise.resolve()
  innerBox.getBoxes = () => [fileBox]
  innerBox.render = () => Promise.resolve()
  fileBox.render = () => Promise.resolve()

  return {box: box, innerBox: innerBox, fileBox: fileBox}
}
