import { mock } from 'jest-mock-extended'
import { BoxMapData } from '../../src/box/BoxMapData'
import { FolderBox } from '../../src/box/FolderBox'
import { FileBox } from '../../src/box/FileBox'
import { BoxWatcher } from '../../src/box/BoxWatcher'

test('getBoxBySourcePathAndRenderIfNecessary path with one element', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: BoxWatcher|undefined = await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/innerBox')
  if (!result) {
    fail()
  }
  expect(await result.get()).toBe(scenario.innerBox)
})

test('getBoxBySourcePathAndRenderIfNecessary path with two element', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: BoxWatcher|undefined = await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/innerBox/fileBox')
  if (!result) {
    fail()
  }
  expect(await result.get()).toBe(scenario.fileBox)
})

test('getBoxBySourcePathAndRenderIfNecessary invalid path with elements after file', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: BoxWatcher|undefined = await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/innerBox/fileBox/invalid')
  expect(result).toBe(undefined)
})

test('getBoxBySourcePathAndRenderIfNecessary path with not existing element', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: BoxWatcher|undefined = await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/notExisting')
  expect(result).toBe(undefined)
})

function setupScenarioForGetBoxBySourcePathAndRenderIfNecessary(): {
  box: FolderBox,
  innerBox: FolderBox,
  fileBox: FileBox
} {
  const box: FolderBox = new FolderBox('src/box', null, mock<BoxMapData>(), false)
  const innerBox: FolderBox = new FolderBox('innerBox', box, mock<BoxMapData>(), false)
  const fileBox: FileBox = new FileBox('fileBox', innerBox, mock<BoxMapData>(), false)

  box.getSrcPath = () => 'src/box'
  box.getBoxes = () => [innerBox]
  box.render = () => Promise.resolve()
  innerBox.getBoxes = () => [fileBox]
  innerBox.render = () => Promise.resolve()
  fileBox.render = () => Promise.resolve()

  return {box: box, innerBox: innerBox, fileBox: fileBox}
}
