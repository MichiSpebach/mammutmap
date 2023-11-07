import { Box } from './Box';
import { boxManager } from './BoxManager'
import { util } from '../util/util'
import { map } from '../Map'

export class BoxWatcher {
  private box: Box|null
  private boxId: string
  private boxSrcPath: string

  public static async newAndWatch(box: Box): Promise<BoxWatcher> {
    const watcher: BoxWatcher = new BoxWatcher(box)
    await box.addWatcherAndUpdateRender(watcher)
    return watcher
  }

  private constructor(box: Box) {
    this.box = box
    this.boxId = box.getId()
    this.boxSrcPath = box.getSrcPath()
  }

  public async get(): Promise<Box> {
    if (this.box) {
      return this.box
    }
    let box: Box|undefined = boxManager.getBoxIfExists(this.boxId)
    if (box) {
      this.box = box
      box.addWatcherAndUpdateRender(this)
      return this.box
    }
    // TODO:
    /*box = (await map?.getRootFolder().getBoxBySourcePathAndRenderIfNecessary(this.boxSrcPath, this))?.box
    if (box) {
      this.box = box
      return this.box
    }*/
    util.logError('failed to load box '+this.boxSrcPath)
  }

  public async unwatch(): Promise<void> {
    if (!this.box) {
      util.logError('trying to unwatch unwatched box '+this.boxSrcPath)
    }
    await this.box.removeWatcherAndUpdateRender(this)
    this.boxSrcPath = this.box.getSrcPath()
    this.box = null
  }

}
