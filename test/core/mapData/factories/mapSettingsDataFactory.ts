import { MapSettingsData } from '../../../../src/core/mapData/MapSettingsData'

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