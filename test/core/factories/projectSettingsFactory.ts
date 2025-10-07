import { MapSettingsData } from '../../../src/core/mapData/MapSettingsData'
import { ProjectSettings } from '../../../src/core/ProjectSettings'

export function of(options: {projectSettingsFilePath?: string, data: MapSettingsData}): ProjectSettings {
    return new ProjectSettings(options.projectSettingsFilePath ?? 'fakeProjectSettingsFilePath', options.data, false)
}