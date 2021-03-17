import * as fileSystem from '../fileSystemAdapter'
import { FolderBox } from './FolderBox'
import { BoxMapData } from './BoxMapData'

export class RootFolderBox extends FolderBox {

  private static mapFileName = 'mapRoot.json' // TODO: find a more unique name

  private mapPath: string

  public static async new(srcPath: string, mapPath: string): Promise<RootFolderBox> {
    const data: {mapData: BoxMapData, mapDataFileExists: boolean} = await fileSystem.loadMapData(mapPath+'/'+RootFolderBox.mapFileName)
    return new RootFolderBox(srcPath, mapPath, data.mapData, data.mapDataFileExists)
  }

  private constructor(srcPath: string, mapPath: string, mapData: BoxMapData, mapDataFileExists: boolean) {
    super(srcPath, null, mapData, mapDataFileExists)
    this.mapPath = mapPath
  }

  public getSrcPath(): string {
    return this.getName()
  }

  public getMapPath(): string {
    return this.mapPath
  }

  public getMapDataFilePath(): string {
    return this.getMapPath()+'/'+RootFolderBox.mapFileName
  }

  public isRoot(): boolean {
    return true
  }

}
