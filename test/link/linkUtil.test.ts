import * as linkUtil from '../../src/link/linkUtil'
import { WayPointData } from '../../src/box/WayPointData'
import { util } from '../../src/util'

const actualLogWarning: (message: string) => void = util.logWarning

beforeEach(() => { // TODO: use something like expect(<mock>).noFurtherCalls() in afterAll()
    // reset logWarning in case that a test mocked and overwrote it to prevent unexpected warnings to be suppressed
    util.logWarning = actualLogWarning
})

test('calculatePathOfUnchangedLinkEndOfChangedLink link fully rendered and path did not changed at all', () => {
    const oldPath: WayPointData[] = [buildWayPoint('outer'), buildWayPoint('inner')]
    const renderedPath: WayPointData[] = [buildWayPoint('outer'), buildWayPoint('inner')]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, renderedPath)

    expect(newPath).toEqual(oldPath)
})
test('calculatePathOfUnchangedLinkEndOfChangedLink link shallow rendered and path did not changed at all', () => {
    const oldPath: WayPointData[] = [buildWayPoint('outer'), buildWayPoint('inner')]
    const shallowRenderedPath: WayPointData[] = [buildWayPoint('outer')]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, shallowRenderedPath)

    expect(newPath).toEqual(oldPath)
})

test('calculatePathOfUnchangedLinkEndOfChangedLink link fully rendered and first WayPoint changes', () => {
    const oldPath: WayPointData[] = [buildWayPoint('outerOld'), buildWayPoint('inner')]
    const renderedPath: WayPointData[] = [buildWayPoint('outerNew'), buildWayPoint('inner')]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, renderedPath)

    expect(newPath).toEqual(renderedPath)
})
test('calculatePathOfUnchangedLinkEndOfChangedLink link shallow rendered and first WayPoint changes', () => {
    const outerOld: WayPointData = buildWayPoint('outerOld')
    const outerNew: WayPointData = buildWayPoint('outerNew')
    const inner: WayPointData = buildWayPoint('inner')
    const oldPath: WayPointData[] = [outerOld, inner]
    const shallowRenderedPath: WayPointData[] = [outerNew, inner]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, shallowRenderedPath)

    expect(newPath).toEqual([outerNew, inner])
})

test('calculatePathOfUnchangedLinkEndOfChangedLink shallowRenderedPath is empty', () => {
    const oldPath: WayPointData[] = [buildWayPoint('outerOld'), buildWayPoint('inner')]
    const shallowRenderedPath: WayPointData[] = []
    const logWarning = jest.fn()
    util.logWarning = logWarning

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, shallowRenderedPath)

    expect(logWarning).toBeCalledWith('Something is off, shallowRenderedPath is empty, this should never happen.')
    expect(newPath).toEqual(oldPath)
})

test('calculatePathOfUnchangedLinkEndOfChangedLink link fully rendered and first WayPoint was deleted', () => {
    const oldPath: WayPointData[] = [buildWayPoint('outerOld'), buildWayPoint('inner')]
    const renderedPath: WayPointData[] = [buildWayPoint('inner')]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, renderedPath)

    expect(newPath).toEqual(renderedPath)
})
test('calculatePathOfUnchangedLinkEndOfChangedLink link shallow rendered and first WayPoint was deleted', () => {
    const outerOld: WayPointData = buildWayPoint('outerOld')
    const middle: WayPointData = buildWayPoint('middle')
    const inner: WayPointData = buildWayPoint('inner')
    const oldPath: WayPointData[] = [outerOld, middle, inner]
    const renderedPath: WayPointData[] = [middle]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, renderedPath)

    expect(newPath).toEqual([middle, inner])
})

test('calculatePathOfUnchangedLinkEndOfChangedLink link fully rendered and WayPoint in front was added', () => {
    const oldPath: WayPointData[] = [buildWayPoint('inner')]
    const renderedPath: WayPointData[] = [buildWayPoint('outerNew'), buildWayPoint('inner')]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, renderedPath)

    expect(newPath).toEqual(renderedPath)
})
test('calculatePathOfUnchangedLinkEndOfChangedLink link shallow rendered and WayPoint in front was added', () => {
    const outerNew: WayPointData = buildWayPoint('outerNew')
    const middle: WayPointData = buildWayPoint('middle')
    const inner: WayPointData = buildWayPoint('inner')
    const oldPath: WayPointData[] = [middle, inner]
    const shallowRenderedPath: WayPointData[] = [outerNew, middle]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, shallowRenderedPath)

    expect(newPath).toEqual([outerNew, middle, inner])
})

test('calculatePathOfUnchangedLinkEndOfChangedLink deepest rendered WayPoint is not contained in oldPath', () => {
    const outer: WayPointData = buildWayPoint('outer')
    const middleOld: WayPointData = buildWayPoint('middleOld')
    const middleNew: WayPointData = buildWayPoint('middleNew')
    const inner: WayPointData = buildWayPoint('inner')
    const oldPath: WayPointData[] = [outer, middleOld, inner]
    const shallowRenderedPath: WayPointData[] = [outer, middleNew]
    const logWarning = jest.fn()
    util.logWarning = logWarning

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, shallowRenderedPath)

    expect(logWarning).toBeCalledWith('Something is off, deepest rendered WayPoint of shallowRenderedPath is not contained in oldPath, this should never happen.')
    expect(newPath).toEqual([outer, middleNew, middleOld, inner])
})

test('calculatePathOfUnchangedLinkEndOfChangedLink link fully rendered and WayPoint within was changed', () => {
    const outer: WayPointData = buildWayPoint('outer')
    const middleOld: WayPointData = buildWayPoint('middleOld')
    const middleNew: WayPointData = buildWayPoint('middleNew')
    const inner: WayPointData = buildWayPoint('inner')
    const oldPath: WayPointData[] = [outer, middleOld, inner]
    const renderedPath: WayPointData[] = [outer, middleNew, inner]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, renderedPath)

    expect(newPath).toEqual([outer, middleNew, inner])
})
test('calculatePathOfUnchangedLinkEndOfChangedLink link shallow rendered and WayPoint within was changed', () => {
    const outer: WayPointData = buildWayPoint('outer')
    const middleOld: WayPointData = buildWayPoint('middleOld')
    const middleNew: WayPointData = buildWayPoint('middleNew')
    const innerRendered: WayPointData = buildWayPoint('innerRendered')
    const innerUnrendered: WayPointData = buildWayPoint('innerUnrendered')
    const oldPath: WayPointData[] = [outer, middleOld, innerRendered, innerUnrendered]
    const shallowRenderedPath: WayPointData[] = [outer, middleNew, innerRendered]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, shallowRenderedPath)

    expect(newPath).toEqual([outer, middleNew, innerRendered, innerUnrendered])
})

test('calculatePathOfUnchangedLinkEndOfChangedLink link fully rendered and box within path was deleted', () => {
    const outer: WayPointData = buildWayPoint('outer')
    const middleOld: WayPointData = buildWayPoint('middleOld')
    const inner: WayPointData = buildWayPoint('inner')
    const oldPath: WayPointData[] = [outer, middleOld, inner]
    const renderedPath: WayPointData[] = [outer, inner]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, renderedPath)

    expect(newPath).toEqual([outer, inner])
})
test('calculatePathOfUnchangedLinkEndOfChangedLink link shallow rendered and box within path was deleted', () => {
    const outer: WayPointData = buildWayPoint('outer')
    const middleOld: WayPointData = buildWayPoint('middleOld')
    const innerRendered: WayPointData = buildWayPoint('innerRendered')
    const innerUnrendered: WayPointData = buildWayPoint('innerUnrendered')
    const oldPath: WayPointData[] = [outer, middleOld, innerRendered, innerUnrendered]
    const shallowRenderedPath: WayPointData[] = [outer, innerRendered]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, shallowRenderedPath)

    expect(newPath).toEqual([outer, innerRendered, innerUnrendered])
})

test('calculatePathOfUnchangedLinkEndOfChangedLink link fully rendered and box within path was inserted', () => {
    const outer: WayPointData = buildWayPoint('outer')
    const middleNew: WayPointData = buildWayPoint('middleNew')
    const inner: WayPointData = buildWayPoint('inner')
    const oldPath: WayPointData[] = [outer, inner]
    const renderedPath: WayPointData[] = [outer, middleNew, inner]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, renderedPath)

    expect(newPath).toEqual([outer, middleNew, inner])
})
test('calculatePathOfUnchangedLinkEndOfChangedLink link shallow rendered and box within path was inserted', () => {
    const outer: WayPointData = buildWayPoint('outer')
    const middleNew: WayPointData = buildWayPoint('middleNew')
    const innerRendered: WayPointData = buildWayPoint('innerRendered')
    const innerUnrendered: WayPointData = buildWayPoint('innerUnrendered')
    const oldPath: WayPointData[] = [outer, innerRendered, innerUnrendered]
    const shallowRenderedPath: WayPointData[] = [outer, middleNew, innerRendered]

    const newPath: WayPointData[] = linkUtil.calculatePathOfUnchangedLinkEndOfChangedLink(oldPath, shallowRenderedPath)

    expect(newPath).toEqual([outer, middleNew, innerRendered, innerUnrendered])
})

function buildWayPoint(idPrefix: string): WayPointData {
    return WayPointData.buildNew(idPrefix+'BoxId', idPrefix+'BoxName', 50, 50)
}