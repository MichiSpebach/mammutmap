import { FolderBox } from './FolderBox'
import { ProjectSettings } from '../ProjectSettings'
import { ClientRect } from '../ClientRect'
import { renderManager, RenderPriority } from '../RenderManager'
import { BoxContext } from './BoxContext'

export class RootFolderBox extends FolderBox {
  private readonly idRenderedInto: string
  private cachedClientRect: ClientRect|null = null

  public constructor(context: BoxContext, idRenderedInto: string) {
    super(
      context.projectSettings.getAbsoluteSrcRootPath(), 
      null, 
      context.projectSettings.data, 
      context.projectSettings.isDataFileExisting(), 
      context
    )
    this.idRenderedInto = idRenderedInto
  }

  public override getSrcPath(): string {
    return this.context.projectSettings.getAbsoluteSrcRootPath()
  }

  public override getMapPath(): string {
    return this.context.projectSettings.getAbsoluteMapRootPath()
  }

  public override getMapDataFilePath(): string {
    return this.context.projectSettings.getProjectSettingsFilePath()
  }

  public override getProjectSettings(): ProjectSettings {
    return this.context.projectSettings
  }

  public override isRoot(): boolean {
    return true
  }

  public override async saveMapData(): Promise<void> {
    if (!this.isMapDataFileExisting()) {
      await this.context.projectSettings.saveToFileSystem()
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
