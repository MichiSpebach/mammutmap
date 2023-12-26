import { util } from '../util/util'
import { renderManager } from '../RenderManager'
import { style } from '../styleAdapter'
import * as contextMenu from '../contextMenu'
import { Box } from './Box'
import { BoxData } from '../mapData/BoxData'
import { FolderBoxHeader } from './header/FolderBoxHeader'
import { FolderBoxBody } from './FolderBoxBody'
import { BoxWatcher } from './BoxWatcher'
import { BoxLinks } from './BoxLinks'
import { NodeWidget } from '../node/NodeWidget'
import { ClientPosition } from '../shape/ClientPosition'
import { fileSystem } from '../fileSystemAdapter'
import { log } from '../logService'
import { BoxContext } from './BoxContext'

export class FolderBox extends Box {
  public readonly body: FolderBoxBody

  public constructor(name: string, parent: FolderBox|null, mapData: BoxData, mapDataFileExists: boolean, context?: BoxContext) {
    super(name, parent, mapData, mapDataFileExists, context)
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

  public override getChilds(): (Box|NodeWidget)[] { // TODO: change return type to AbstractNodeWidget as soon as available
    return [...super.getChilds(), ...this.getBoxes()]
  }

  protected override async renameAndMoveOnFileSystem(oldSrcPath: string, newSrcPath: string, oldMapDataFilePath: string, newMapDataFilePath: string): Promise<void> {
    await super.renameAndMoveOnFileSystem(oldSrcPath, newSrcPath, oldMapDataFilePath, newMapDataFilePath)
    if (this.isMapDataFileExisting()) {
      const oldMapDataFolderPath: string = oldMapDataFilePath.replace(/.json$/, '')
      const newMapDataFolderPath: string = newMapDataFilePath.replace(/.json$/, '')
      if (newMapDataFolderPath !== this.getMapPath()) {
        let message = `FolderBox::renameAndMoveOnFileSystem(..) expected newMapDataFolderPath to be '${this.getMapPath()}', but is '${newMapDataFolderPath}'.`
        message += ` Hint: newMapDataFolderPath is derived from newMapDataFilePath that is '${newMapDataFilePath}'.`
        util.logWarning(message)
      }
      await fileSystem.rename(oldMapDataFolderPath, newMapDataFolderPath)
      util.logInfo(`moved '${oldMapDataFolderPath}' to '${newMapDataFolderPath}'`)
    }
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
    await renderManager.addEventListenerTo(this.getId(), 'contextmenu', (clientX: number, clientY: number) => contextMenu.openForFolderBox(this, new ClientPosition(clientX, clientY)))
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

  public isBodyBeingRendered(): boolean {
    return this.body.isBeingRendered()
  }

  // TODO: only used by plugins, move into pluginUtil/boxFinder?
  public async getBoxBySourcePathAndRenderIfNecessary(
    path: string, 
    options?: {ignoreFileEndings?: boolean, onlyReturnWarnings?: boolean, foreachBoxInPath?: (box: Box) => void}
  ): Promise<{boxWatcher?: BoxWatcher, warnings?: string[]}> {
    if (!path.startsWith(this.getName())) {
      return this.warn('path '+path+' must start with name of box '+this.getName(), options)
    }

    const temporaryBoxWatcher: BoxWatcher = await BoxWatcher.newAndWatch(this)

    const resultBoxWatcherWithWarnings: {
      boxWatcher?: BoxWatcher, warnings?: string[]
    } = await this.findBoxInChildsBySourcePathAndRenderIfNecessary(path, options)

    this.removeWatcher(temporaryBoxWatcher)
    return resultBoxWatcherWithWarnings
  }

  private async findBoxInChildsBySourcePathAndRenderIfNecessary(
    path: string, 
    options?: {ignoreFileEndings?: boolean, onlyReturnWarnings?: boolean, foreachBoxInPath?: (box: Box) => void}
  ): Promise<{boxWatcher?: BoxWatcher, warnings?: string[]}> {
    const remainingPath: string = util.removeStartFromPath(this.getName(), path)

    for (const box of this.getBoxes()) {
      if (util.getElementCountOfPath(remainingPath) === 1 && util.matchFileNames(remainingPath, box.getName(), options)) {
        if (options?.foreachBoxInPath) {
          options.foreachBoxInPath(box)
        }
        const boxWatcher: BoxWatcher = await BoxWatcher.newAndWatch(box)
        return {boxWatcher}
      }
      if (util.getElementsOfPath(remainingPath)[0] === box.getName()) {
        if (options?.foreachBoxInPath) {
          options.foreachBoxInPath(box)
        }
        if (!box.isFolder() || !(box instanceof FolderBox)) {
          return this.warn(box.getSrcPath()+' is not last element in path '+path+' but is not a folder', options)
        }
        return box.getBoxBySourcePathAndRenderIfNecessary(remainingPath, options)
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

  /** TODO: 'getLoadedBoxesInPath' would be more exact, rename? */
  public getRenderedBoxesInPath(path: string): Box[] {
    const remainingPath: string = util.removeStartFromPath(this.getName(), path)
    if (remainingPath === '' || !this.isBodyBeingRendered()) {
      return [this]
    }
    const remainingPathElements: string[] = util.getElementsOfPath(remainingPath)

    for (const box of this.getBoxes()) {
      if (util.matchFileNames(remainingPathElements[0], box.getName())) {
        if (remainingPathElements.length === 1) {
          return [this, box]
        }
        if (!box.isFolder() || !(box instanceof FolderBox)) {
          // TODO: move this method into Box as soon as general Nodes are implemented
          log.warning(`FolderBox::getRenderedBoxesInPath(path: '${path}') '${box.getSrcPath()}' is not last element in path but is also not a folder.`)
          return [this, box]
        }
        return [this, ...box.getRenderedBoxesInPath(remainingPath)]
      }
    }

    log.warning(`FolderBox::getRenderedBoxesInPath(path: '${path}') not found in '${this.getSrcPath()}'.`)
    return [this]
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

  public async addNewFileAndSave(name: string, mapData: BoxData): Promise<void> {
    await this.body.addNewFileAndSave(name, mapData)
  }

  public async addNewFolderAndSave(name: string, mapData: BoxData): Promise<void> {
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
