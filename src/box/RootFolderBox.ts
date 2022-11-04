import { FolderBox } from './FolderBox'
import { ProjectSettings } from '../ProjectSettings'
import { ClientRect } from '../ClientRect'
import { renderManager, RenderPriority } from '../RenderManager'

export class RootFolderBox extends FolderBox {
  private readonly projectSettings: ProjectSettings
  private readonly idRenderedInto: string
  private cachedClientRect: ClientRect|null = null

  public constructor(projectSettings: ProjectSettings, idRenderedInto: string) {
    super(projectSettings.getAbsoluteSrcRootPath(), null, projectSettings.data, projectSettings.isDataFileExisting())
    this.projectSettings = projectSettings
    this.idRenderedInto = idRenderedInto
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

  public getProjectSettings(): ProjectSettings {
    return this.projectSettings
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

  protected async renderStyle(priority: RenderPriority = RenderPriority.NORMAL): Promise<void> {
    await super.renderStyle(priority)
    this.clearCachedClientRect()
  }

  public async getParentClientRect(): Promise<ClientRect> {
    return renderManager.getClientRectOf(this.idRenderedInto, RenderPriority.RESPONSIVE)
  }

  public async getClientRect(): Promise<ClientRect> {
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
