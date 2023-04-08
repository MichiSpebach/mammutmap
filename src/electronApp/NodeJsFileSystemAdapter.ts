import * as fs from 'fs'
import { Dirent, promises as fsPromises } from 'fs'
import { dialog } from 'electron'
import { FileSystemAdapter, OpenDialogOptions, OpenDialogReturnValue } from '../core/fileSystemAdapter'
import { util } from '../core/util/util'

export class NodeJsFileSystemAdapter extends FileSystemAdapter {

  public async doesDirentExistAndIsFile(path: string): Promise<boolean> {
    const direntStats: fs.Stats|null = await this.getDirentStatsIfExists(path)
    return direntStats !== null && direntStats.isFile()
  }

  public async doesDirentExist(path: string): Promise<boolean> {
    const direntStats: fs.Stats|null = await this.getDirentStatsIfExists(path)
    return direntStats !== null
  }

  public async getDirentStatsIfExists(path: string): Promise<fs.Stats|null> {
    try {
      return await this.getDirentStatsOrThrow(path) // without await, catch would not work
    } catch(_) {
      return null
    }
  }

  public async getDirentStatsOrThrow(path: string): Promise<fs.Stats|never> {
    return fsPromises.stat(path)
  }

  public async readdir(path: string): Promise<Dirent[]> {
    return fsPromises.readdir(path, {withFileTypes: true}).catch((reason) => {
      util.logWarning('Failed to readdir because: '+reason)
    }).then()
  }

  public readFile(path: string): Promise<string> {
    return fsPromises.readFile(path, 'utf-8')
  }

  public readFileSync(path: string): string {
    return fs.readFileSync(path, 'utf-8')
  }

  public async writeFile(path: string, data: string, options?: {throwInsteadOfWarn?: boolean}): Promise<void> {
    let directory = util.removeLastElementFromPath(path)
    await this.makeFolder(directory)

    if (options?.throwInsteadOfWarn) {
      await fsPromises.writeFile(path, data)
    } else {
      await fsPromises.writeFile(path, data).catch((reason) => {
        util.logWarning(`NodeJsFileSystemAdapter::writeFile(..) failed at path "${path}", reason is ${reason}`)
      })
    }
  }

  public async makeFolder(path: string): Promise<void> {
    await fsPromises.mkdir(path, {recursive: true})
  }

  public async symlink(existingPath: string, newPath: string, type?: 'dir'|'file'|'junction'): Promise<void> {
    await fsPromises.symlink(existingPath, newPath, type).catch((reason) => {
      util.logWarning('Failed to symlink because: '+reason)
    }).then()
  }

  public async rename(oldPath: string, newPath: string): Promise<void> {
    const newFolderPath: string = util.removeLastElementFromPath(newPath)
    if (!await this.doesDirentExist(newFolderPath)) {
      await this.makeFolder(newFolderPath)
    }
    return fsPromises.rename(oldPath, newPath)
  }

  public showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue> {
    return dialog.showOpenDialog(options)
  }

}
