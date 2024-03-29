import { util } from './util/util'
import { JsonObject } from './JsonObject'

export interface Stats {
  size: number // TODO: rename to sizeInBytes?
  isFile(): boolean
}

export interface Dirent {
  name: string
  isFile(): boolean
  isDirectory(): boolean
}

export class FileStatsBasicImpl implements Stats {
  public readonly size: number

  public constructor(sizeInBytes: number) {
    this.size = sizeInBytes
  }

  public isFile(): boolean {
    return true
  }
}

export class DirectoryStatsBasicImpl implements Stats {
  public readonly size: number = 0

  public isFile(): boolean {
    return false
  }
}

export class UnknownDirentKindStatsBasicImpl implements Stats {
  public readonly size: number = 0
  public readonly kind: string

  public constructor(kind: string) {
    this.kind = kind
  }

  public isFile(): boolean {
    return false
  }
}

export class DirentBasicImpl implements Dirent {
  public readonly name: string
  public readonly kind: 'directory'|'file'
  
  public constructor(name: string, kind: 'directory'|'file') {
    this.name = name
    this.kind = kind
  }

  public isFile() {
    return this.kind === 'file'
  }

  public isDirectory() {
    return this.kind === 'directory'
  }
}

export interface FileFilter { // subset of Electron.FileFilter
  extensions: string[]
  name: string
}

export interface OpenDialogOptions { // subset of Electron.OpenDialogOptions
  title?: string
  filters?: FileFilter[]
  properties?: Array<'openFile'|'openDirectory'>
}

export interface OpenDialogReturnValue { // subset of Electron.OpenDialogReturnValue
  filePaths: string[]
}

export let fileSystem: FileSystemAdapter

export function init(object: FileSystemAdapter): void {
  fileSystem = object
}

/**
 * TODO: some methods don't fit here, introduce fileSystemTools|fileSystemJsonTools|fileSystemDataLayer|fileSystemObjectLayer that calls this adapter
 * and move loadFromJsonFile(..), saveToJsonFile(..), mergeObjectIntoJsonFile(..), readFileAndConvertToHtml(..) there
 * then change FileSystemAdapter from class to interface
 */
export abstract class FileSystemAdapter {

  private ongoingOperations: {path: string, promise: Promise<unknown>}[] = []

  /** on some operating systems files can get corrupted when accessed concurrently */
  // TODO: use this for all file operations
  private async scheduleOperation<T>(pathToWaitFor: string, action: () => Promise<T>): Promise<T> {
    const ongoing: {path: string, promise: Promise<unknown>} | undefined = this.ongoingOperations.find(ongoing => ongoing.path === pathToWaitFor)
    if (ongoing) {
      await ongoing.promise
      return this.scheduleOperation(pathToWaitFor, action)
    }

    const promise: Promise<T> = action()

    this.ongoingOperations.push({path: pathToWaitFor, promise})
    await promise
    this.ongoingOperations.splice(this.ongoingOperations.findIndex(finished => finished.promise === promise), 1)
    return promise
  }

  public async loadFromJsonFile<T>(filePath: string, buildFromJson: (json: string) => T): Promise<T|null> {
    return this.readFile(filePath)
      .then(json => {
        return buildFromJson(json)
      })
      .catch(_ => {
        return null
      })
  }

  public async saveToJsonFile(filePath: string, object: JsonObject, options?: {throwInsteadOfWarn?: boolean}): Promise<void> {
    if (await this.doesDirentExist(filePath)) {
      await this.mergeObjectIntoJsonFile(filePath, object, options)
    } else {
      await this.writeFile(filePath, object.toJson(), options)
    }
  }

  public async mergeObjectIntoJsonFile(path: string, object: JsonObject, options?: {throwInsteadOfWarn?: boolean}): Promise<void> {
    await this.scheduleOperation(path, async (): Promise<void> => {
      const originalJson: string = await this.readFile(path)
      const mergedJson: string = object.mergeIntoJson(originalJson)
      await this.writeFile(path, mergedJson, options)
    })
  }

  public abstract doesDirentExistAndIsFile(path: string): Promise<boolean>

  public abstract doesDirentExist(path: string): Promise<boolean>

  public abstract getDirentStatsIfExists(path: string): Promise<Stats|null>

  public abstract getDirentStatsOrThrow(path: string): Promise<Stats|never>

  public abstract readdir(path: string): Promise<Dirent[]>

  public async readFileAndConvertToHtml(path: string): Promise<string> {
    return util.escapeForHtml(await this.readFile(path))
  }

  public abstract readFile(path: string): Promise<string>

  public abstract readFileSync(path: string): string

  public abstract writeFile(path: string, data: string, options?: {throwInsteadOfWarn?: boolean}): Promise<void>

  public abstract makeFolder(path: string): Promise<void>

  public abstract symlink(existingPath: string, newPath: string, type?: 'dir'|'file'|'junction'): Promise<void>

  public abstract rename(oldPath: string, newPath: string): Promise<void>

  public abstract showOpenDialog(options: OpenDialogOptions): Promise<OpenDialogReturnValue>

}
