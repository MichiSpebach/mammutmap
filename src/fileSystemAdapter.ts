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

  public async saveMapData(mapDataFilePath: string, data: BoxMapData): Promise<void> {
    if (await this.doesDirentExist(mapDataFilePath)) {
      await this.mergeObjectIntoJsonFile(mapDataFilePath, data)
        .catch(reason => util.logWarning('failed to merge mapData into '+mapDataFilePath+': '+reason))
    } else {
      await this.writeFile(mapDataFilePath, data.toJson())
        .catch(reason => util.logWarning('failed to save '+mapDataFilePath+': '+reason))
    }
  }

  public async doesDirentExist(path: string): Promise<boolean> {
    try {
      await fsPromises.stat(path)
      return true
    } catch(_) {
      return false
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
