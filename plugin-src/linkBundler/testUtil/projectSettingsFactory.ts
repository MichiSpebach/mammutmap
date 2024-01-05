/**
 * copied from '../../../test/core/factories/projectSettingsFactory'
 * importing from 'test' would lead to imports from 'src' and not from 'dist' which would result in other modules
 * TODO: find better solution
 */
import { MapSettingsData } from '../../../dist/core/mapData/MapSettingsData'
import { ProjectSettings } from '../../../dist/core/ProjectSettings'

export function of(options: {projectSettingsFilePath?: string, data: MapSettingsData}): ProjectSettings {
    return new ProjectSettings(options.projectSettingsFilePath ?? 'fakeProjectSettingsFilePath', options.data, false)
}