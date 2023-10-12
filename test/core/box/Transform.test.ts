import { Transform } from '../../../src/core/box/Transform'
import { ClientPosition } from '../../../src/core/shape/ClientPosition'
import { LocalPosition } from '../../../src/core/shape/LocalPosition'
import { FolderBox } from '../../../src/core/box/FolderBox'
import { ClientRect } from '../../../src/core/ClientRect'
import * as boxFactory from './factories/boxFactory'
import { RootFolderBox } from '../../../src/core/box/RootFolderBox'
import { BoxManager, init as initBoxManager } from '../../../src/core/box/BoxManager'
import { LocalRect } from '../../../src/core/LocalRect'

test('localToClientPosition', async () => {
  const result: ClientPosition = await setupScenario().transform.localToClientPosition(new LocalPosition(50, 50))
  expect(result.x).toBe(700)
  expect(result.y).toBe(400)
})

test('fromParentPosition', async () => {
  initBoxManager(new BoxManager())
  const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root'})
  const box: FolderBox = boxFactory.folderOf({idOrData: 'src/box', parent: root, addToParent: false})

  box.getLocalRect = () => new LocalRect(25, 25, 50, 50)
  expect(box.transform.fromParentPosition(new LocalPosition(50, 50))).toEqual(new LocalPosition(50, 50))
  expect(box.transform.fromParentPosition(new LocalPosition(25, 25))).toEqual(new LocalPosition(0, 0))
  expect(box.transform.fromParentPosition(new LocalPosition(75, 25))).toEqual(new LocalPosition(100, 0))
  expect(box.transform.fromParentPosition(new LocalPosition(0, 100))).toEqual(new LocalPosition(-50, 150))

  box.getLocalRect = () => new LocalRect(50, 0, 50, 50)
  expect(box.transform.fromParentPosition(new LocalPosition(50, 50))).toEqual(new LocalPosition(0, 100))
  expect(box.transform.fromParentPosition(new LocalPosition(75, 25))).toEqual(new LocalPosition(50, 50))
  expect(box.transform.fromParentPosition(new LocalPosition(25, 25))).toEqual(new LocalPosition(-50, 50))
  expect(box.transform.fromParentPosition(new LocalPosition(100, 100))).toEqual(new LocalPosition(100, 200))
  expect(box.transform.fromParentPosition(new LocalPosition(100, 0))).toEqual(new LocalPosition(100, 0))
  expect(box.transform.fromParentPosition(new LocalPosition(200, 25))).toEqual(new LocalPosition(300, 50))
  expect(box.transform.fromParentPosition(new LocalPosition(-50, -50))).toEqual(new LocalPosition(-200, -100))
})

test('getNearestGridPositionOfOtherTransform', async () => {
  const scenario = setupScenario()
  const result: LocalPosition = await setupScenario().transform.getNearestGridPositionOfOtherTransform(new ClientPosition(609, 354), scenario.otherTransform)
  expect(result.percentX).toBeCloseTo(26.5, 10)
  expect(result.percentY).toBeCloseTo(27, 10)
})

test('getNearestGridPositionOf rounds to multiple of 4', () => {
  const result: LocalPosition = setupScenario().transform.getNearestGridPositionOf(new LocalPosition(3, 78.1))
  expect(result.percentX).toBe(4)
  expect(result.percentY).toBe(80)
})

function setupScenario(): {transform: Transform, otherTransform: Transform} {
  initBoxManager(new BoxManager())

  const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root'})
  const box: FolderBox = boxFactory.folderOf({idOrData: 'src/box', parent: root, addToParent: false})
  box.getClientRect = () => Promise.resolve(new ClientRect(500, 300, 400, 200))
  const otherBox: FolderBox = boxFactory.folderOf({idOrData: 'src/box/other', parent: box, addToParent: false})
  otherBox.getClientRect = () => Promise.resolve(new ClientRect(550, 350, 200, 100))

  return {transform: box.transform, otherTransform: otherBox.transform}
}
