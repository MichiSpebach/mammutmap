import { util } from '../util'
import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu'
import { Box } from './Box'
import { BoxMapData } from './BoxMapData'
import { FolderBoxHeader } from './FolderBoxHeader'
import { FolderBoxBody } from './FolderBoxBody'
import { BoxWatcher } from './BoxWatcher'

export class FolderBox extends Box {
  private readonly body: FolderBoxBody

  public constructor(name: string, parent: FolderBox|null, mapData: BoxMapData, mapDataFileExists: boolean) {
    super(name, parent, mapData, mapDataFileExists)
    this.body = new FolderBoxBody(this)
  }

  protected createHeader(): FolderBoxHeader {
    return new FolderBoxHeader(this)
  }

  public isFolder(): boolean {
    return true
  }

  public isFile(): boolean {
    return false
  }

  protected getBodyOverflowStyle(): 'hidden'|'visible' {
    return 'visible'
  }

  protected async renderAdditional(): Promise<void> {
    if (this.isRendered()) {
      return
    }

    const proms: Promise<any>[] = []
    proms.push(renderManager.addClassTo(super.getId(), style.getFolderBoxClass()))
    proms.push(renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForFolderBox(this, clientX, clientY)))
    await Promise.all(proms)
  }

  protected async unrenderAdditional(): Promise<void> {
    if (!this.isRendered()) {
      return
    }

    await renderManager.removeEventListenerFrom(this.getId(), 'contextmenu')
  }

  protected getBodyId(): string {
    return this.body.getId()
  }

  protected async renderBody(): Promise<void> {
    await this.body.render()
  }

  protected async unrenderBodyIfPossible(force?: boolean): Promise<{rendered: boolean}> {
    return this.body.unrenderIfPossible(force)
  }

  public isBodyRendered(): boolean {
    return this.body.isRendered()
  }

  public async getBoxBySourcePathAndRenderIfNecessary(path: string): Promise<BoxWatcher|undefined> {
    if (!path.startsWith(this.getName())) {
      util.logError('path '+path+' must start with name of box '+this.getName())
    }

    const temporaryBoxWatcher: BoxWatcher = new BoxWatcher(this)
    await this.addWatcherAndUpdateRender(temporaryBoxWatcher)

    const resultBoxWatcher: BoxWatcher|undefined = await this.findBoxInChildsBySourcePathAndRenderIfNecessary(path)

    this.removeWatcher(temporaryBoxWatcher)
    return resultBoxWatcher
  }

  private async findBoxInChildsBySourcePathAndRenderIfNecessary(path: string): Promise<BoxWatcher|undefined> {
    const remainingPath: string = path.substr(this.getName().length+1)

    for (const box of this.getBoxes()) {
      if (remainingPath.startsWith(box.getName())) {
        if (remainingPath === box.getName()) {
          const boxWatcher: BoxWatcher = new BoxWatcher(box)
          await box.addWatcherAndUpdateRender(boxWatcher)
          return boxWatcher
        } else {
          if (!box.isFolder()) {
            util.logWarning(box.getSrcPath()+' is not last element in path '+path+' but is not a folder')
            return undefined
          }
          const boxWatcher: BoxWatcher|undefined = await (box as FolderBox).getBoxBySourcePathAndRenderIfNecessary(remainingPath)
          return boxWatcher
        }
      }
    }

    util.logWarning(path+' not found')
    return undefined
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
