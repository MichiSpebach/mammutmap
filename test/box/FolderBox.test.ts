import { mock } from 'jest-mock-extended'
import { Box } from '../../src/box/Box'
import { BoxMapData } from '../../src/box/BoxMapData'
import { FolderBox } from '../../src/box/FolderBox'
import { FileBox } from '../../src/box/FileBox'

test('getBoxBySourcePathAndRenderIfNecessary path with one element', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: Box|undefined = await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/innerBox', 'testWatcher')
  expect(result).toBe(scenario.innerBox)
})

test('getBoxBySourcePathAndRenderIfNecessary path with two element', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: Box|undefined = await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/innerBox/fileBox', 'testWatcher')
  expect(result).toBe(scenario.fileBox)
})

test('getBoxBySourcePathAndRenderIfNecessary invalid path with elements after file', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: Box|undefined = await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/innerBox/fileBox/invalid', 'testWatcher')
  expect(result).toBe(undefined)
})

test('getBoxBySourcePathAndRenderIfNecessary path with not existing element', async () => {
  const scenario = setupScenarioForGetBoxBySourcePathAndRenderIfNecessary()
  const result: Box|undefined = await scenario.box.getBoxBySourcePathAndRenderIfNecessary('src/box/notExisting', 'testWatcher')
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
  innerBox.getBoxes = () => [fileBox]

  return {box: box, innerBox: innerBox, fileBox: fileBox}
}
