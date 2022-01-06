import { mock } from 'jest-mock-extended'
import { ClientPosition, LocalPosition, Transform } from '../../src/box/Transform'
import { BoxMapData } from '../../src/box/BoxMapData'
import { FolderBox } from '../../src/box/FolderBox'
import { Rect } from '../../src/Rect'

test('localToClientPosition', async () => {
  const result: ClientPosition = await setupScenario().transform.localToClientPosition(new LocalPosition(50, 50))
  expect(result.x).toBe(700)
  expect(result.y).toBe(400)
})

test('getNearestGridPositionOfOtherTransform', async () => {
  const scenario = setupScenario()
  const result: LocalPosition = await setupScenario().transform.getNearestGridPositionOfOtherTransform(new ClientPosition(609, 346), scenario.otherTransform)
  expect(result.percentX).toBeCloseTo(27.5, 10)
  expect(result.percentY).toBeCloseTo(22.5, 10)
})

test('getNearestGridPositionOf rounds to multiple of 5', () => {
  const result: LocalPosition = setupScenario().transform.getNearestGridPositionOf(new LocalPosition(3, 67))
  expect(result.percentX).toBe(5)
  expect(result.percentY).toBe(65)
})

function setupScenario(): {transform: Transform, otherTransform: Transform} {
  const box: FolderBox = new FolderBox('src/box', null, mock<BoxMapData>(), false)
  box.getClientRect = () => Promise.resolve(new Rect(500, 300, 400, 200))
  const otherBox: FolderBox = new FolderBox('src/box/other', null, mock<BoxMapData>(), false)
  otherBox.getClientRect = () => Promise.resolve(new Rect(500, 300, 200, 100))

  return {transform: box.transform, otherTransform: otherBox.transform}
}
