import * as fs from 'fs'
import { Dirent, promises as fsPromises } from 'fs'
import { util } from './util'
import { BoxMapData } from './box/BoxMapData'

class FileSystem {

  public async loadMapData(mapDataFilePath: string): Promise<BoxMapData|null> {
    return this.readFile(mapDataFilePath)
      .then(json => {
        return BoxMapData.buildFromJson(json)
      })
      .catch(_ => {
        return null
      })
  }

  public async loadFromJson<T extends BoxMapData>(filePath: string, buildFromJson: (json: string) => T): Promise<T|null> {
    return this.readFile(filePath)
      .then(json => {
        return buildFromJson(json)
      })
      .catch(_ => {
        return null
      })
  }

  public async saveMapData(mapDataFilePath: string, data: BoxMapData): Promise<void> {
    await this.saveObject(mapDataFilePath, data)
  }

  public async saveObject(filePath: string, object: Object): Promise<void> {
    if (await this.doesDirentExist(filePath)) {
      await this.mergeObjectIntoJsonFile(filePath, object)
        .catch(reason => util.logWarning('failed to merge object into '+filePath+': '+reason))
    } else {
      await this.writeFile(filePath, util.toFormattedJson(object))
        .catch(reason => util.logWarning('failed to write '+filePath+': '+reason))
    }
  }

  public async doesDirentExistAndIsFile(path: string): Promise<boolean> {
    const direntStats: fs.Stats|null = await this.getDirentStats(path)
    return direntStats !== null && direntStats.isFile()
  }

  public async doesDirentExist(path: string): Promise<boolean> {
    const direntStats: fs.Stats|null = await this.getDirentStats(path)
    return direntStats !== null
  }

  public async getDirentStats(path: string): Promise<fs.Stats|null> {
    try {
      return await fsPromises.stat(path) // without await catch would not work
    } catch(_) {
      return null
    }
  }

  public readdir(path: string): Promise<Dirent[]> {
    return fsPromises.readdir(path, {withFileTypes: true})
  }

  public async readFileAndConvertToHtml(path: string): Promise<string> {
    return util.escapeForHtml(await this.readFile(path))
  }

  public readFile(path: string): Promise<string> {
    return fsPromises.readFile(path, 'utf-8')
  }

  public readFileSync(path: string): string {
    return fs.readFileSync(path, 'utf-8')
  }

  public async mergeObjectIntoJsonFile(path: string, object: Object): Promise<void> {
    // TODO: improve: originalJson should only changed where needed (not completely reformatted)
    const originalJson: string = await this.readFile(path)
    const originalObject: Object = JSON.parse(originalJson)

    const mergedObject: Object = {...originalObject, ...object}
    const mergedJson: string = util.toFormattedJson(mergedObject)

    await this.writeFile(path, mergedJson)
  }

  public async writeFile(path: string, data: string): Promise<void> {
    let directory = ''
    const fileEntries: string[] = path.split('/')
    for (let i = 0; i < fileEntries.length - 1; i++) {
      directory += fileEntries[i] + '/'
    }

    await fsPromises.mkdir(directory, {recursive: true})
    return fsPromises.writeFile(path, data)
  }

  public async rename(oldPath: string, newPath: string): Promise<void> {
    return fsPromises.rename(oldPath, newPath)
  }

}

export let fileSystem: FileSystem = new FileSystem()
