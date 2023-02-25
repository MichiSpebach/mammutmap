import { ClientPosition } from '../../src/core/shape/ClientPosition'
import { ClientRect } from '../../src/core/ClientRect'

test('calculateIntersectionsWithLine', () => {
  const rect = new ClientRect(40, 40, 20, 20)

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(0, 0)})).toEqual([new ClientPosition(40, 40)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(0, 0), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(40, 40)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(50, 0)})).toEqual([new ClientPosition(50, 40)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 0), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(50, 40)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(75, 0)})).toEqual([new ClientPosition(55, 40)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(75, 0), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(55, 40)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(100, 0)})).toEqual([new ClientPosition(60, 40)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(100, 0), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(60, 40)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(100, 1)})).toEqual([new ClientPosition(60, 40.2)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(100, 1), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(60, 40.2)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(100, 50)})).toEqual([new ClientPosition(60, 50)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(100, 50), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(60, 50)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(100, 100)})).toEqual([new ClientPosition(60, 60)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(100, 100), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(60, 60)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(50, 100)})).toEqual([new ClientPosition(50, 60)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 100), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(50, 60)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(25, 100)})).toEqual([new ClientPosition(45, 60)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(25, 100), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(45, 60)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(0, 100)})).toEqual([new ClientPosition(40, 60)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(0, 100), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(40, 60)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(0, 99)})).toEqual([new ClientPosition(40, 59.8)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(0, 99), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(40, 59.8)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(0, 50)})).toEqual([new ClientPosition(40, 50)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(0, 50), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(40, 50)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(0, 25)})).toEqual([new ClientPosition(40, 45)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(0, 25), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(40, 45)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(50, 50), to: new ClientPosition(0, 1)})).toEqual([new ClientPosition(40, 40.2)])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(0, 1), to: new ClientPosition(50, 50)})).toEqual([new ClientPosition(40, 40.2)])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(45, 45), to: new ClientPosition(55, 55)})).toEqual([])
  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(35, 35), to: new ClientPosition(30, 30)})).toEqual([])

  expect(rect.calculateIntersectionsWithLine({from: new ClientPosition(45, 45), to: new ClientPosition(65, 35)})).toEqual([new ClientPosition(55, 40)])
})
