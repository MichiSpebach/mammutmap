import { fileSystem } from '../fileSystemAdapter'
import { FolderBox } from './FolderBox'
import { BoxMapData } from './BoxMapData'
import { ProjectSettings } from '../ProjectSettings'
import { Rect } from '../Rect'
import { renderManager, RenderPriority } from '../RenderManager'

export class RootFolderBox extends FolderBox {
  private projectSettings: ProjectSettings
  private cachedClientRect: Rect|null = null

  public static async new(projectSettings: ProjectSettings): Promise<RootFolderBox> {
    let mapData: BoxMapData|null = await fileSystem.loadFromJsonFile(projectSettings.getProjectSettingsFilePath(), BoxMapData.buildFromJson)
    const mapDataFileExists: boolean = (mapData !== null)
    if (mapData === null) {
      mapData = BoxMapData.buildNew(5, 5, 90, 90)
    }

    return new RootFolderBox(projectSettings, mapData, mapDataFileExists)
  }

  public constructor(projectSettings: ProjectSettings, mapData: BoxMapData, mapDataFileExists: boolean) {
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
    if (!this.isMapDataFileExisting()) {
      await this.projectSettings.saveToFileSystem()
    }
    await super.saveMapData()
  }

  public async getClientRect(): Promise<Rect> {
    if (!this.cachedClientRect) {
      this.cachedClientRect = await renderManager.getClientRectOf(this.getId(), RenderPriority.RESPONSIVE)
    } else {
      // in case of some weird window changes, fault is fixed asynchronously and is not permanent
      renderManager.getClientRectOf(this.getId(), RenderPriority.NORMAL).then(rect => this.cachedClientRect = rect)
    }
    return this.cachedClientRect
  }

  public clearCachedClientRect(): void {
    this.cachedClientRect = null
  }

}
