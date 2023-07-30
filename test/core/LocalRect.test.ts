import { LocalRect } from '../../src/core/LocalRect'

test('createEnclosing', () => {
    const topLeftRect = new LocalRect(10, 10, 40, 40)
    const bottomRightRect = new LocalRect(55, 55, 40, 40)
    const largeRect = new LocalRect(20, 20, 80, 80)

    expect(LocalRect.createEnclosing([topLeftRect, bottomRightRect])).toEqual(new LocalRect(10, 10, 85, 85))
    expect(LocalRect.createEnclosing([topLeftRect, largeRect])).toEqual(new LocalRect(10, 10, 90, 90))
    expect(LocalRect.createEnclosing([topLeftRect, bottomRightRect, largeRect])).toEqual(new LocalRect(10, 10, 90, 90))
})