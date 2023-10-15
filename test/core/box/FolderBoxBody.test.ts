import { mock, MockProxy } from 'jest-mock-extended'
import { Box } from '../../../src/core/box/Box'
import { BoxData } from '../../../src/core/mapData/BoxData'
import { FolderBox } from '../../../src/core/box/FolderBox'
import { FolderBoxBody } from '../../../src/core/box/FolderBoxBody'
import { renderManager } from '../../../src/core/RenderManager'
import { BoxContext } from '../../../src/core/box/BoxContext'
import * as testUtil from '../../testUtil'

test('containsBoxByName', () => {
  testUtil.initGeneralServicesWithMocks()
  const referenceBox: FolderBox = new FolderBox('referenceBox', null, mock<BoxData>(), false, mock<BoxContext>())
  const folderBoxBody = new FolderBoxBody(referenceBox)
  const box: MockProxy<Box> = mock<Box>()
  box.getName.mockReturnValue('box')

  renderManager.appendChildTo = () => Promise.resolve()
  folderBoxBody.addBox(box)

  expect(folderBoxBody.containsBoxByName('box')).toBe(true)
  expect(folderBoxBody.containsBoxByName('boxNotContained')).toBe(false)
})
