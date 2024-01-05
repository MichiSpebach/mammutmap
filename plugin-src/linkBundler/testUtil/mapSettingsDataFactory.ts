/**
 * copied from '../../../test/core/mapData/factories/mapSettingsDataFactory'
 * importing from 'test' would lead to imports from 'src' and not from 'dist' which would result in other modules
 * TODO: find better solution
 */
import { MapSettingsData } from '../../../dist/core/mapData/MapSettingsData'

export function of(options: {id: string, srcRootPath?: string, mapRootPath?: string}): MapSettingsData {
    return new MapSettingsData({
        id: options.id,
        x: 20, y: 20, width: 60, height: 60,
        links: [],
        nodes: [],
        srcRootPath: options.srcRootPath ?? 'fakeSrcRootPath',
        mapRootPath: options.mapRootPath ?? 'fakeMapRootPath',
        linkTags: []
    })
}