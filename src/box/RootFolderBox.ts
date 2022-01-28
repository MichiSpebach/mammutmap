import { fileSystem } from '../fileSystemAdapter'
import { FolderBox } from './FolderBox'
import { BoxMapData } from './BoxMapData'
import { ProjectSettings } from '../ProjectSettings'

export class RootFolderBox extends FolderBox {

  private projectSettings: ProjectSettings

  public static async new(projectSettings: ProjectSettings): Promise<RootFolderBox> {
    let mapData: BoxMapData|null = await fileSystem.loadFromJsonFile(projectSettings.getProjectSettingsFilePath(), BoxMapData.buildFromJson)
    const mapDataFileExists: boolean = (mapData !== null)
    if (mapData === null) {
      mapData = BoxMapData.buildNew(5, 5, 90, 90)
    }

    return new RootFolderBox(projectSettings, mapData, mapDataFileExists)
  }

  private constructor(projectSettings: ProjectSettings, mapData: BoxMapData, mapDataFileExists: boolean) {
    super(projectSettings.getAbsoluteSrcRootPath(), null, mapData, mapDataFileExists)
    this.projectSettings = projectSettings
  }

  public getSrcPath(): string {
    return this.projectSettings.getAbsoluteSrcRootPath()
  }

  public getMapPath(): string {
    return this.projectSettings.getAbsoluteMapRootPath()
  }

  public getMapDataFilePath(): string {
    return this.projectSettings.getProjectSettingsFilePath()
  }

  public isRoot(): boolean {
    return true
  }

  public async saveMapData(): Promise<void> {
    await super.saveMapData()
    if (!this.isMapDataFileExisting()) {
      await this.projectSettings.saveToFileSystem()
    }
  }

}
