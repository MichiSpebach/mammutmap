import { MapSettingsData } from '../../src/mapData/MapSettingsData'
import { ProjectSettings } from '../../src/ProjectSettings'
import * as mapSettingsDataFactory from '../mapData/factories/mapSettingsDataFactory'

export function of(options: {id: string}): ProjectSettings {
    const mapData: MapSettingsData = mapSettingsDataFactory.of({id: options.id})
    return new ProjectSettings('fakeProjectSettingsFilePath', mapData, false)
}