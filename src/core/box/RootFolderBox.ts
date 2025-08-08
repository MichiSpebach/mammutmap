import { FolderBox } from './FolderBox'
import { ProjectSettings } from '../ProjectSettings'
import { ClientRect } from '../ClientRect'
import { renderManager, RenderPriority } from '../renderEngine/renderManager'
import { BoxContext } from './BoxContext'
import { LocalRect } from '../LocalRect'

export class RootFolderBox extends FolderBox {
  private readonly idRenderedInto: string
  private cachedParentClientRect: ClientRect|null = null

  public constructor(context: BoxContext, idRenderedInto: string) {
    let name: string = context.projectSettings.getAbsoluteSrcRootPath()
    if (name.endsWith('/')) {
      name = name.substring(0, name.length-1)
    }
    super(
      name, 
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

  public override async renderStyle(priority: RenderPriority = RenderPriority.NORMAL, transitionDurationInMS?: number): Promise<void> {
    await super.renderStyle(priority, transitionDurationInMS)
  }

  public override async getClientRect(): Promise<ClientRect> {
    const localRect: LocalRect = this.getLocalRect()
    const parentClientRect: ClientRect = await this.getParentClientRect()
    return new ClientRect(
      parentClientRect.x + (localRect.x/100)*parentClientRect.width,
      parentClientRect.y + (localRect.y/100)*parentClientRect.height,
      (localRect.width/100)*parentClientRect.width,
      (localRect.height/100)*parentClientRect.height
    )
  }

  public override async getParentClientRect(): Promise<ClientRect> {
    if (!this.cachedParentClientRect) {
      // TODO: set cachedParentClientRect in constructor? then simple ClientRect can be returned without Promise
      this.cachedParentClientRect = ClientRect.of(await renderManager.getClientRectOf(this.idRenderedInto, RenderPriority.RESPONSIVE))
    } else {
      // in case of some weird window changes, fault is fixed asynchronously and is not permanent
      renderManager.getClientRectOf(this.idRenderedInto, RenderPriority.NORMAL).then(rect => this.cachedParentClientRect = ClientRect.of(rect))
    }
    return this.cachedParentClientRect
  }

  public clearCachedParentClientRect(): void {
    this.cachedParentClientRect = null
  }

}
