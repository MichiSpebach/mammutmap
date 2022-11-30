import { MapSettingsData } from '../../src/mapData/MapSettingsData'
import { ProjectSettings } from '../../src/ProjectSettings'

export function of(options: {id: string}): ProjectSettings {
    const mapData = new MapSettingsData({
        id: options.id,
        x: 20, y: 20, width: 60, height: 60,
        links: [],
        nodes: [],
        srcRootPath: 'fakeSrcRootPath',
        mapRootPath: 'fakeMapRootPath',
        linkTags: []
    })

    return new ProjectSettings('fakeProjectSettingsFilePath', mapData, false)
}