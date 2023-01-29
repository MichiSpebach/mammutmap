import { MapSettingsData } from '../../../src/core/mapData/MapSettingsData'
import { ProjectSettings } from '../../../src/core/ProjectSettings'
import * as mapSettingsDataFactory from '../mapData/factories/mapSettingsDataFactory'

export function of(options: {id: string}): ProjectSettings {
    const mapData: MapSettingsData = mapSettingsDataFactory.of({id: options.id})
    return new ProjectSettings('fakeProjectSettingsFilePath', mapData, false)
}