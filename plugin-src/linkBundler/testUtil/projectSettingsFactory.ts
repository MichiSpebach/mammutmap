import { MapSettingsData } from '../../../dist/core/mapData/MapSettingsData'
import { ProjectSettings } from '../../../dist/core/ProjectSettings'

export function of(options: {projectSettingsFilePath?: string, data: MapSettingsData}): ProjectSettings {
    return new ProjectSettings(options.projectSettingsFilePath ?? 'fakeProjectSettingsFilePath', options.data, false)
}