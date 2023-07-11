import { MapSettingsData } from '../../../src/core/mapData/MapSettingsData'
import { ProjectSettings } from '../../../src/core/ProjectSettings'
import * as mapSettingsDataFactory from '../mapData/factories/mapSettingsDataFactory'

export function of(options: {projectSettingsFilePath?: string, data: MapSettingsData}): ProjectSettings {
    return new ProjectSettings(options.projectSettingsFilePath ?? 'fakeProjectSettingsFilePath', options.data, false)
}