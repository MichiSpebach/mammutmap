import { dom } from '../domAdapter'
import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu'
import { Box } from './Box'
import { BoxMapData } from './BoxMapData'
import { FolderBoxHeader } from './FolderBoxHeader'
import { FolderBoxBody } from './FolderBoxBody'

export class FolderBox extends Box {
  private readonly body: FolderBoxBody

  public constructor(name: string, parent: FolderBox|null, mapData: BoxMapData, mapDataFileExists: boolean) {
    super(name, parent, mapData, mapDataFileExists)
    this.body = new FolderBoxBody(this)
  }

  protected createHeader(): FolderBoxHeader {
    return new FolderBoxHeader(this)
  }

  protected getOverflow(): 'visible' {
    return 'visible'
  }

  protected async renderAdditional(): Promise<void> {
    if (this.isRendered()) {
      return
    }

    renderManager.addClassTo(super.getId(), style.getFolderBoxClass())
    dom.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForFolderBox(this, clientX, clientY))
  }

  protected async renderBody(): Promise<void> {
    await this.body.render()
  }

  public isBodyRendered(): boolean {
    return this.body.isRendered()
  }

  public getBox(id: string): Box {
    return this.body.getBox(id)
  }

  public getBoxes(): Box[] {
    return this.body.getBoxes()
  }

  public containsBox(box: Box): boolean {
    return this.body.containsBox(box)
  }

  public async addBox(box: Box): Promise<void> {
    return this.body.addBox(box)
  }

  public removeBox(box: Box): void {
    return this.body.removeBox(box)
  }

}
