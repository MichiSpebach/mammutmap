/**
 * copied from '../../../test/core/mapData/factories/mapSettingsDataFactory'
 * importing from 'test' would lead to imports from 'src' and not from 'dist' which would result in other modules
 * TODO: find better solution
 */
import { MapSettingsData } from '../../../dist/core/mapData/MapSettingsData'

export function of(options: {id: string, x?: number, y?: number, width?: number, height?: number, srcRootPath?: string, mapRootPath?: string}): MapSettingsData {
    return new MapSettingsData({
        id: options.id,
        x: options.x?? 20,
        y: options.y?? 20,
        width: options.width?? 60,
        height: options.height?? 60,
        links: [],
        nodes: [],
        srcRootPath: options.srcRootPath ?? 'fakeSrcRootPath',
        mapRootPath: options.mapRootPath ?? 'fakeMapRootPath',
        linkTags: []
    })
}