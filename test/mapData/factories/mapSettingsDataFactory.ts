import { MapSettingsData } from '../../../src/mapData/MapSettingsData'

export function of(options: {id: string}): MapSettingsData {
    return new MapSettingsData({
        id: options.id,
        x: 20, y: 20, width: 60, height: 60,
        links: [],
        nodes: [],
        srcRootPath: 'fakeSrcRootPath',
        mapRootPath: 'fakeMapRootPath',
        linkTags: []
    })
}