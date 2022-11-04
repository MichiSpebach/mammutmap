import { mock, MockProxy } from 'jest-mock-extended'
import { Box } from '../../src/box/Box'
import { BoxData } from '../../src/mapData/BoxData'
import { FolderBox } from '../../src/box/FolderBox'
import { FolderBoxBody } from '../../src/box/FolderBoxBody'
import { renderManager } from '../../src/RenderManager'

test('containsBoxByName', () => {
  const referenceBox: FolderBox = new FolderBox('referenceBox', mock<FolderBox>(), mock<BoxData>(), false)
  const folderBoxBody = new FolderBoxBody(referenceBox)
  const box: MockProxy<Box> = mock<Box>()
  box.getName.mockReturnValue('box')

  renderManager.appendChildTo = () => Promise.resolve()
  folderBoxBody.addBox(box)

  expect(folderBoxBody.containsBoxByName('box')).toBe(true)
  expect(folderBoxBody.containsBoxByName('boxNotContained')).toBe(false)
})
