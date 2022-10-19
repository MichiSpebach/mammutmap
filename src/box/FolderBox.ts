import { util } from '../util'
import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu/contextMenu'
import { Box } from './Box'
import { BoxMapData } from './BoxMapData'
import { FolderBoxHeader } from './FolderBoxHeader'
import { FolderBoxBody } from './FolderBoxBody'
import { BoxWatcher } from './BoxWatcher'
import { BoxLinks } from './BoxLinks'

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

  protected getBodyOverflowStyle(): 'auto'|'hidden'|'visible' {
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
  public async getBoxBySourcePathAndRenderIfNecessary(
    path: string, 
    options?: {ignoreFileEndings?: boolean, onlyReturnWarnings?: boolean}
  ): Promise<{boxWatcher?: BoxWatcher, warnings?: string[]}> {
    if (!path.startsWith(this.getName())) {
      return this.warn('path '+path+' must start with name of box '+this.getName(), options)
    }

    const temporaryBoxWatcher: BoxWatcher = new BoxWatcher(this)
    await this.addWatcherAndUpdateRender(temporaryBoxWatcher)

    const resultBoxWatcherWithWarnings: {
      boxWatcher?: BoxWatcher, warnings?: string[]
    } = await this.findBoxInChildsBySourcePathAndRenderIfNecessary(path, options)

    this.removeWatcher(temporaryBoxWatcher)
    return resultBoxWatcherWithWarnings
  }

  private async findBoxInChildsBySourcePathAndRenderIfNecessary(
    path: string, 
    options?: {ignoreFileEndings?: boolean, onlyReturnWarnings?: boolean}
  ): Promise<{boxWatcher?: BoxWatcher, warnings?: string[]}> {
    let remainingPath: string = path.substring(this.getName().length)
    if (remainingPath.startsWith('/') || remainingPath.startsWith('\\')) {
      remainingPath = remainingPath.substring(1)
    }

    for (const box of this.getBoxes()) {
      if (util.getElementCountOfPath(remainingPath) === 1 && util.matchFileNames(remainingPath, box.getName(), options)) {
        const boxWatcher: BoxWatcher = new BoxWatcher(box)
        await box.addWatcherAndUpdateRender(boxWatcher)
        return {boxWatcher}
      }
      if (remainingPath.startsWith(box.getName())) {
        if (!box.isFolder()) {
          return this.warn(box.getSrcPath()+' is not last element in path '+path+' but is not a folder', options)
        }
        return (box as FolderBox).getBoxBySourcePathAndRenderIfNecessary(remainingPath, options)
      }
    }

    return this.warn(path+' not found', options)
  }

  // TODO: move to util?
  private warn(message: string, options: {onlyReturnWarnings?: boolean} | undefined): {warnings: string[]} {
    if (!options?.onlyReturnWarnings) {
      util.logWarning(message)
    }
    return {warnings: [message]}
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

  public rearrangeBoxesWithoutMapData(grabbedBox: Box): Promise<void> {
    return this.body.rearrangeBoxesWithoutMapData(grabbedBox)
  }

  public getInnerLinksRecursive(): BoxLinks[] {
    const innerLinks: BoxLinks[] = this.getBoxes().map(box => box.getInnerLinksRecursive()).flat()
    innerLinks.unshift(this.links)
    return innerLinks
  }

}
