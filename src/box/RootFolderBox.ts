import { fileSystem } from '../fileSystemAdapter'
import { FolderBox } from './FolderBox'
import { BoxMapData } from './BoxMapData'

export class RootFolderBox extends FolderBox {

  private static mapFileName = 'mapRoot.json' // TODO: find a more unique name

  private mapPath: string

  public static async new(srcPath: string, mapPath: string): Promise<RootFolderBox> {
    let mapData: BoxMapData|null = await fileSystem.loadMapData(mapPath+'/'+RootFolderBox.mapFileName)
    const mapDataFileExists: boolean = (mapData !== null)
    if (mapData === null) {
      mapData = BoxMapData.buildNew(5, 5, 90, 90)
    }

    return new RootFolderBox(srcPath, mapPath, mapData, mapDataFileExists)
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
