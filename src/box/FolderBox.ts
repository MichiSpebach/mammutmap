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

  public isSourceless(): boolean {
    return false
  }

  protected getBodyOverflowStyle(): 'hidden'|'visible' {
    return 'visible'
  }

  protected getBackgroundStyleClass(): string {
    return style.getFolderBoxBackgroundClass()
  }

  protected async renderAdditional(): Promise<void> {
    if (this.isRendered()) {
      return
    }
    await renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForFolderBox(this, clientX, clientY))
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

  // TODO: only used by plugins, move into pluginUtil/boxFinder?
  public async getBoxBySourcePathAndRenderIfNecessary(path: string, options?: {ignoreFileEndings?: boolean}): Promise<BoxWatcher|undefined> {
    if (!path.startsWith(this.getName())) {
      util.logWarning('path '+path+' must start with name of box '+this.getName())
      return undefined
    }

    const temporaryBoxWatcher: BoxWatcher = new BoxWatcher(this)
    await this.addWatcherAndUpdateRender(temporaryBoxWatcher)

    const resultBoxWatcher: BoxWatcher|undefined = await this.findBoxInChildsBySourcePathAndRenderIfNecessary(path, options)

    this.removeWatcher(temporaryBoxWatcher)
    return resultBoxWatcher
  }

  private async findBoxInChildsBySourcePathAndRenderIfNecessary(path: string, options?: {ignoreFileEndings?: boolean}): Promise<BoxWatcher|undefined> {
    let remainingPath: string = path.substring(this.getName().length)
    if (remainingPath.startsWith('/') || remainingPath.startsWith('\\')) {
      remainingPath = remainingPath.substring(1)
    }

    for (const box of this.getBoxes()) {
      if (util.getElementCountOfPath(remainingPath) === 1 && util.matchFileNames(remainingPath, box.getName(), options)) {
        const boxWatcher: BoxWatcher = new BoxWatcher(box)
        await box.addWatcherAndUpdateRender(boxWatcher)
        return boxWatcher
      }
      if (remainingPath.startsWith(box.getName())) {
        if (!box.isFolder()) {
          util.logWarning(box.getSrcPath()+' is not last element in path '+path+' but is not a folder')
          return undefined
        }
        const boxWatcher: BoxWatcher|undefined = await (box as FolderBox).getBoxBySourcePathAndRenderIfNecessary(remainingPath)
        return boxWatcher
      }
    }

    util.logWarning(path+' not found')
    return undefined
  }

  public getBox(id: string): Box|undefined {
    return this.body.getBox(id)
  }

  public getBoxes(): Box[] {
    return this.body.getBoxes()
  }

  public containsBox(box: Box): boolean {
    return this.body.containsBox(box)
  }

  public async addNewFileAndSave(name: string, mapData: BoxMapData): Promise<void> {
    await this.body.addNewFileAndSave(name, mapData)
  }

  public async addNewFolderAndSave(name: string, mapData: BoxMapData): Promise<void> {
    await this.body.addNewFolderAndSave(name, mapData)
  }

  public async addBox(box: Box): Promise<void> {
    return this.body.addBox(box)
  }

  public removeBox(box: Box): void {
    return this.body.removeBox(box)
  }

}
