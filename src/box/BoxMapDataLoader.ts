import { Dirent } from 'original-fs'
import { util } from '../util'
import { fileSystem } from '../fileSystemAdapter'
import { BoxMapData } from './BoxMapData'
import { FolderBox } from './FolderBox'
import { FolderBoxBody } from './FolderBoxBody'
import { boxManager } from './BoxManager'
import { ProjectSettings } from '../ProjectSettings'

export class BoxMapDataLoader {
  private readonly referenceBox: FolderBox
  private readonly referenceBoxBody: FolderBoxBody

  public constructor(referenceBox: FolderBox, referenceBoxBody: FolderBoxBody) {
    this.referenceBox = referenceBox
    this.referenceBoxBody = referenceBoxBody
  }

  public async loadDirents(): Promise<{
    sourcesWithoutMapData: Dirent[],
    mapDataWithoutSources: Dirent[]
    sourcesWithMapData: {source: Dirent, map: Dirent}[],
  }> {
    const sourceDirents: Dirent[] = await this.loadSourceDirents()
    const mapFileDirents: Dirent[] = await this.loadMapFileDirents()
    const sourcesWithMapData: {source: Dirent, map: Dirent}[] = []

    for (let mapFileDirentIndex = 0; mapFileDirentIndex < mapFileDirents.length; mapFileDirentIndex++) {
      const mapFileDirent: Dirent = mapFileDirents[mapFileDirentIndex]
      for (const sourceDirent of sourceDirents) {
        if (sourceDirent.name+'.json' === mapFileDirent.name) {
          sourcesWithMapData.push({source: sourceDirent, map: mapFileDirent})
          sourceDirents.splice(sourceDirents.indexOf(sourceDirent), 1)
          mapFileDirents.splice(mapFileDirents.indexOf(mapFileDirent), 1)
          mapFileDirentIndex--
          break
        }
      }
    }

    return {sourcesWithoutMapData: sourceDirents, mapDataWithoutSources: mapFileDirents, sourcesWithMapData}
  }

  private loadSourceDirents(): Promise<Dirent[]> {
    return fileSystem.readdir(this.referenceBox.getSrcPath())
  }

  private async loadMapFileDirents(): Promise<Dirent[]> {
    const mapPath: string = this.referenceBox.getMapPath()
    if (! await fileSystem.doesDirentExist(mapPath)) {
      return Promise.resolve([])
    }
    return (await fileSystem.readdir(mapPath)).filter(dirent => dirent.isFile())
  }

  public async loadMapDatasOfSourcesWithMapData(
    sourcesWithMapData: {source: Dirent, map: Dirent}[]
  ): Promise<{
    sourcesWithLoadedMapData: {source: Dirent, mapData: BoxMapData}[],
    sourcesWithLoadingFailedMapData: Dirent[]
  }> {
    const sourcesWithLoadingMapData: {source: Dirent, mapFilePath: string, mapData: Promise<BoxMapData|null>}[] = []

    for (const sourceWithMap of sourcesWithMapData) {
      if (!this.referenceBoxBody.containsBoxByName(sourceWithMap.source.name)) {
        const mapFilePath: string = util.concatPaths(this.referenceBox.getMapPath(), sourceWithMap.map.name)
        const mapData: Promise<BoxMapData|null> = fileSystem.loadFromJsonFile(mapFilePath, BoxMapData.buildFromJson)
        sourcesWithLoadingMapData.push({source: sourceWithMap.source, mapFilePath, mapData})
      }
    }

    const sourcesWithLoadedMapData: {source: Dirent, mapData: BoxMapData}[] = []
    const sourcesWithLoadingFailedMapData: Dirent[] = []

    for (const sourceWithLoadingMapData of sourcesWithLoadingMapData) {
      const mapData: BoxMapData|null = await sourceWithLoadingMapData.mapData
      if (!mapData) {
        util.logWarning('failed to load mapData in '+sourceWithLoadingMapData.mapFilePath)
        sourcesWithLoadingFailedMapData.push(sourceWithLoadingMapData.source)
        continue
      }
      if (boxManager.getBoxIfExists(mapData.id)) {
        util.logWarning('skipping '+sourceWithLoadingMapData.mapFilePath+' because its id '+mapData.id+' is already in use by another box')
        continue
      }
      sourcesWithLoadedMapData.push({source: sourceWithLoadingMapData.source, mapData})
    }

    return {sourcesWithLoadedMapData, sourcesWithLoadingFailedMapData}
  }

  public filterSourcesWithoutMapData(sourceDirents: Dirent[]): Dirent[] {
    for (let sourceDirentIndex = 0; sourceDirentIndex < sourceDirents.length; sourceDirentIndex++) {
      const sourceDirent: Dirent = sourceDirents[sourceDirentIndex]
      if (this.referenceBoxBody.containsBoxByName(sourceDirent.name)) {
        sourceDirents.splice(sourceDirents.indexOf(sourceDirent), 1)
        sourceDirentIndex--
      }
    }
    return sourceDirents
  }

  public async loadMapDatasWithoutSources(mapDirents: Dirent[]): Promise<{boxName: string, mapData: BoxMapData}[]> {
    const mapDatasLoading: {boxName: string, mapFilePath: string, mapData: Promise<BoxMapData|null>}[] = []

    for (const mapDirent of mapDirents) {
      if (!mapDirent.name.endsWith('.json')) {
        util.logWarning('expected map file to have .json suffix, map file is '+mapDirent.name)
      }
      const boxName: string = mapDirent.name.substring(0, mapDirent.name.length-5)
      if (!this.referenceBoxBody.containsBoxByName(boxName)) {
        const mapFilePath: string = util.concatPaths(this.referenceBox.getMapPath(), mapDirent.name)
        const mapData: Promise<BoxMapData|null> = fileSystem.loadFromJsonFile(mapFilePath, BoxMapData.buildFromJson)
        mapDatasLoading.push({boxName, mapFilePath, mapData})
      }
    }

    const mapDatasLoaded: {boxName: string, mapData: BoxMapData}[] = []

    for (const mapDataLoading of mapDatasLoading) {
      const mapData: BoxMapData|null = await mapDataLoading.mapData
      if (!mapData) {
        util.logWarning('failed to load mapData in '+mapDataLoading.mapFilePath)
        continue
      }
      if (boxManager.getBoxIfExists(mapData.id)) {
        if (!ProjectSettings.isProjectSettingsFileName(mapDataLoading.boxName+'.json')) {
          let message = 'skipping '+mapDataLoading.mapFilePath
          message += ' because its id '+mapData.id+' is already in use by another box'
          util.logWarning(message)
        }
        continue
      }
      mapDatasLoaded.push({boxName: mapDataLoading.boxName, mapData})
    }

    return mapDatasLoaded
  }

}
