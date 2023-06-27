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

  public override getSrcPath(): string {
    return this.projectSettings.getAbsoluteSrcRootPath()
  }

  public override getMapPath(): string {
    return this.projectSettings.getAbsoluteMapRootPath()
  }

  public override getMapDataFilePath(): string {
    return this.projectSettings.getProjectSettingsFilePath()
  }

  public override getProjectSettings(): ProjectSettings {
    return this.projectSettings
  }

  public override isRoot(): boolean {
    return true
  }

  public override async saveMapData(): Promise<void> {
    if (!this.isMapDataFileExisting()) {
      await this.projectSettings.saveToFileSystem()
    }
    await super.saveMapData()
  }

  public override async renderStyle(priority: RenderPriority = RenderPriority.NORMAL, transition?: boolean): Promise<void> {
    await super.renderStyle(priority, transition)
    this.clearCachedClientRect()
  }

  public override async getParentClientRect(): Promise<ClientRect> {
    return renderManager.getClientRectOf(this.idRenderedInto, RenderPriority.RESPONSIVE)
  }

  public override async getClientRect(): Promise<ClientRect> {
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
