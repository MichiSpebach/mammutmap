import { mock, MockProxy } from 'jest-mock-extended'
import { Box } from '../../src/box/Box'
import { BoxMapData } from '../../src/box/BoxMapData'
import { FolderBox } from '../../src/box/FolderBox'
import { FolderBoxBody } from '../../src/box/FolderBoxBody'

test('containsBoxByName', () => {
  const referenceBox: FolderBox = new FolderBox('referenceBox', mock<FolderBox>(), mock<BoxMapData>(), false)
  const folderBoxBody = new FolderBoxBody(referenceBox)
  const box: MockProxy<Box> = mock<Box>()
  box.getName.mockReturnValue('box')
  folderBoxBody.addBox(box)

  expect(folderBoxBody.containsBoxByName('box')).toBe(true)
  expect(folderBoxBody.containsBoxByName('boxNotContained')).toBe(false)
})
