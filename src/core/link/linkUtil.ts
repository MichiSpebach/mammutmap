import { util } from '../util/util'
import { WayPointData } from '../mapData/WayPointData'

export function calculatePathOfUnchangedLinkEndOfChangedLink(oldPath: WayPointData[], shallowRenderedPath: WayPointData[]): WayPointData[] {
    if (shallowRenderedPath.length === 0) {
        util.logWarning('Something is off, shallowRenderedPath is empty, this should never happen.')
    }

    const newPath: WayPointData[] = []
    let remainingOldPath: WayPointData[] = oldPath
    let deepestCommonWayPoint: WayPointData|undefined = undefined

    for (let renderedWayPoint of shallowRenderedPath) {
      let newWayPoint: WayPointData = renderedWayPoint
      for (let oldWayPoint of remainingOldPath) {
        if (renderedWayPoint.boxId === oldWayPoint.boxId) {
          newWayPoint = oldWayPoint
          deepestCommonWayPoint = oldWayPoint
          remainingOldPath = remainingOldPath.slice(remainingOldPath.indexOf(oldWayPoint)+1)
          break
        }
      }
      newPath.push(newWayPoint)
    }

    if (deepestCommonWayPoint !== newPath[newPath.length-1]) {
        util.logWarning('Something is off, deepest rendered WayPoint of shallowRenderedPath is not contained in oldPath, this should never happen.')
    }

    newPath.push(...remainingOldPath)

    return newPath
}
