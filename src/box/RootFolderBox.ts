import { FolderBox } from './FolderBox'
import { BoxMapData } from './BoxMapData'

export class RootFolderBox extends FolderBox {

  private mapPath: string

  public constructor(id: string, srcPath: string, mapPath: string) {
    super(id, srcPath, null)
    this.mapPath = mapPath
  }

  public getSrcPath(): string {
    return this.getName()
  }

  public getMapPath(): string {
    return this.mapPath
  }

  protected async loadMapData():Promise<BoxMapData> {
    return BoxMapData.buildDefault()
  }

}
