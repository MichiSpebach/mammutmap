import { LocalPosition } from '../src/box/Transform'
import { Rect } from '../src/Rect'

test('calculateIntersectionOfLineWithRect', () => {
  const rect = new Rect(40, 40, 20, 20)

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(0, 0)})).toEqual(new LocalPosition(40, 40))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(0, 0), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(40, 40))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(50, 0)})).toEqual(new LocalPosition(50, 40))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 0), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(50, 40))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(75, 0)})).toEqual(new LocalPosition(55, 40))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(75, 0), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(55, 40))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(100, 0)})).toEqual(new LocalPosition(60, 40))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(100, 0), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(60, 40))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(100, 1)})).toEqual(new LocalPosition(60, 40.2))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(100, 1), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(60, 40.2))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(100, 50)})).toEqual(new LocalPosition(60, 50))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(100, 50), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(60, 50))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(100, 100)})).toEqual(new LocalPosition(60, 60))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(100, 100), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(60, 60))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(50, 100)})).toEqual(new LocalPosition(50, 60))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 100), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(50, 60))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(25, 100)})).toEqual(new LocalPosition(45, 60))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(25, 100), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(45, 60))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(0, 100)})).toEqual(new LocalPosition(40, 60))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(0, 100), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(40, 60))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(0, 99)})).toEqual(new LocalPosition(40, 59.8))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(0, 99), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(40, 59.8))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(0, 50)})).toEqual(new LocalPosition(40, 50))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(0, 50), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(40, 50))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(0, 25)})).toEqual(new LocalPosition(40, 45))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(0, 25), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(40, 45))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(50, 50), to: new LocalPosition(0, 1)})).toEqual(new LocalPosition(40, 40.2))
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(0, 1), to: new LocalPosition(50, 50)})).toEqual(new LocalPosition(40, 40.2))

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(45, 45), to: new LocalPosition(55, 55)})).toBeUndefined()
  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(35, 35), to: new LocalPosition(30, 30)})).toBeUndefined()

  expect(rect.calculateIntersectionWithLine({from: new LocalPosition(45, 45), to: new LocalPosition(65, 35)})).toEqual(new LocalPosition(55, 40))
})
