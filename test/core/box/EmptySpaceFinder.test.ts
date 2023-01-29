import { EmptySpaceFinder } from '../../../src/core/box/EmptySpaceFinder'
import { LocalRect } from '../../../src/core/LocalRect'

test('findEmptySpaces empty before and count 1', () => {
  const emptySpaceFinder = new EmptySpaceFinder([])
  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(1)
  expect(emptySpaces).toEqual([new LocalRect(4, 8, 92, 88)])
})

test('findEmptySpaces 2 boxes before and count 2', () => {
  const emptySpaceFinder = new EmptySpaceFinder([
    new LocalRect(60, 12, 28, 28), new LocalRect(12, 60, 28, 28)
  ])

  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(2)

  expect(emptySpaces).toEqual([
    new LocalRect(12, 12, 28, 28), new LocalRect(60, 60, 28, 28),
  ])
})

test('findEmptySpaces 4 boxes before and count 1', () => {
  const emptySpaceFinder = new EmptySpaceFinder([
    new LocalRect(12, 12, 28, 28), new LocalRect(60, 12, 28, 28),
    new LocalRect(12, 60, 28, 28), new LocalRect(60, 60, 28, 28),
  ])

  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(1)

  expect(emptySpaces).toEqual([new LocalRect(4, 48, 8, 8)])
})

test('findEmptySpaces 4 boxes before and count 3', () => {
  const emptySpaceFinder = new EmptySpaceFinder([
    new LocalRect(12, 12, 28, 28), new LocalRect(60, 12, 28, 28),
    new LocalRect(12, 60, 28, 28), new LocalRect(60, 60, 28, 28),
  ])

  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(3)

  expect(emptySpaces).toEqual([
    new LocalRect(4, 48, 8, 8), new LocalRect(20, 48, 8, 8), new LocalRect(36, 48, 8, 8)
  ])
})

test('findEmptySpaces no space left and count 4', () => {
  const emptySpaceFinder = new EmptySpaceFinder([new LocalRect(0, 0, 100, 100)])

  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(4)

  expect(emptySpaces).toEqual([
    new LocalRect(4, 8, 20, 20), new LocalRect(36, 8, 20, 20), new LocalRect(68, 8, 20, 20),
    new LocalRect(4, 40, 20, 20),
  ])
})

test('findEmptySpaces empty before and count 4', () => {
  const emptySpaceFinder = new EmptySpaceFinder([])

  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(4)

  expectRectsToHaveUniformDistances(emptySpaces, 4)
  expect(emptySpaces).toEqual([
    new LocalRect(12, 12, 28, 28), new LocalRect(60, 12, 28, 28),
    new LocalRect(12, 60, 28, 28), new LocalRect(60, 60, 28, 28),
  ])
})

test('findEmptySpaces empty before and count 5', () => {
  const emptySpaceFinder = new EmptySpaceFinder([])

  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(5)

  expectRectsToHaveUniformDistances(emptySpaces, 4)
  expect(emptySpaces).toEqual([
    new LocalRect(8, 8, 20, 20), new LocalRect(40, 8, 20, 20), new LocalRect(72, 8, 20, 20),
    new LocalRect(8, 40, 20, 20), new LocalRect(40, 40, 20, 20)
  ])
})

test('findEmptySpaces empty before and count 9', () => {
  const emptySpaceFinder = new EmptySpaceFinder([])

  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(9)

  expectRectsToHaveUniformDistances(emptySpaces, 4)
  expect(emptySpaces).toEqual([
    new LocalRect(8, 8, 20, 20), new LocalRect(40, 8, 20, 20), new LocalRect(72, 8, 20, 20),
    new LocalRect(8, 40, 20, 20), new LocalRect(40, 40, 20, 20), new LocalRect(72, 40, 20, 20),
    new LocalRect(8, 72, 20, 20), new LocalRect(40, 72, 20, 20), new LocalRect(72, 72, 20, 20)
  ])
})

test('findEmptySpaces empty before and count 144', () => {
  const emptySpaceFinder = new EmptySpaceFinder([])

  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(144)

  expect(emptySpaces.length).toEqual(144)
  expectRectsToHaveEqualSize(emptySpaces, 4)
  expectRectsToBeWithinBounds(emptySpaces)
  expectRectsToHaveUniformDistances(emptySpaces, 4)
})

test('findEmptySpaces empty before and count 145', () => {
  const emptySpaceFinder = new EmptySpaceFinder([])

  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(145)

  expect(emptySpaces.length).toEqual(145)
  expectRectsToHaveEqualSize(emptySpaces, 2)
  expectRectsToBeWithinBounds(emptySpaces)
  expectRectsToHaveUniformDistances(emptySpaces, 2)
})

test('findEmptySpaces empty before and count 169', () => {
  const emptySpaceFinder = new EmptySpaceFinder([])

  const emptySpaces: LocalRect[] = emptySpaceFinder.findEmptySpaces(169)

  expect(emptySpaces.length).toEqual(169)
  expectRectsToHaveEqualSize(emptySpaces, 2)
  expectRectsToBeWithinBounds(emptySpaces)
  expectRectsToHaveUniformDistances(emptySpaces, 2)
})

function expectRectsToHaveEqualSize(rects: LocalRect[], minSize: number): void|never {
  const size: number = rects[0].width
  expect(size).toBeGreaterThanOrEqual(minSize)

  for (let rect of rects) {
    expect(rect.width).toBe(size)
    expect(rect.height).toBe(size)
  }
}

function expectRectsToBeWithinBounds(rects: LocalRect[]): void|never {
  for (let rect of rects) {
    expect(rect.x).toBeGreaterThan(0)
    expect(rect.y).toBeGreaterThan(0)
    expect(rect.getRightX()).toBeLessThan(100)
    expect(rect.getBottomY()).toBeLessThan(100)
  }
}

function expectRectsToHaveUniformDistances(rects: LocalRect[], stepSizeAndMaxDeviation: number): void|never {
  let rightDistanceX: number|undefined = undefined
  let leftDistanceX: number|undefined = undefined
  let topDistanceY: number|undefined = undefined
  let boxDistanceX: number|undefined = undefined
  let boxDistanceY: number|undefined = undefined

  let x: number = 0
  let y: number = 0
  for (let rect of rects) {
    const rowHasChanged: boolean = x>rect.x
    if (rowHasChanged) {
      if (!rightDistanceX) {
        rightDistanceX = 100-x
      }
      expect(100-x).toBe(rightDistanceX)
      x = 0
    }

    if (x === 0) {
      if (!leftDistanceX) {
        leftDistanceX = rect.x
      }
      expect(rect.x).toBe(leftDistanceX)
    } else {
      if (!boxDistanceX) {
        boxDistanceX = rect.x-x
      }
      expect(rect.x-x).toBe(boxDistanceX)
    }

    if (y === 0) {
      if (!topDistanceY) {
        topDistanceY = rect.y
      }
      expect(rect.y).toBe(topDistanceY)
    } else if (y !== rect.getBottomY()) {
      if (!boxDistanceY) {
        boxDistanceY = rect.y-y
      }
      expect(rect.y-y).toBe(boxDistanceY)
    }

    x = rect.getRightX()
    y = rect.getBottomY()
  }

  if (!leftDistanceX || !topDistanceY || !boxDistanceX) {
    fail()
  }

  expect(leftDistanceX).toBeGreaterThanOrEqual(stepSizeAndMaxDeviation)
  expect(topDistanceY).toBeGreaterThanOrEqual(stepSizeAndMaxDeviation)
  expect(boxDistanceX).toBeGreaterThanOrEqual(stepSizeAndMaxDeviation)
  if (boxDistanceY !== undefined) { // otherwise single row
    expect(boxDistanceY).toBeGreaterThanOrEqual(stepSizeAndMaxDeviation)
  }
  if (rightDistanceX !== undefined) { // otherwise single row
    expect(rightDistanceX).toBeGreaterThanOrEqual(stepSizeAndMaxDeviation)
    expect(leftDistanceX-rightDistanceX).toBeLessThanOrEqual(stepSizeAndMaxDeviation)
  }
}
