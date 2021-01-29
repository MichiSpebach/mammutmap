import { FolderBox } from './FolderBox'
import { BoxMapData } from './BoxMapData'

export class RootFolderBox extends FolderBox {

  private mapPath: string

  public constructor(id: string, srcPath: string, mapPath: string) {
    super(srcPath, null, new BoxMapData(id, 0, 0, 100, 100, []), false)
    this.mapPath = mapPath
  }

  public getSrcPath(): string {
    return this.getName()
  }

  public getMapPath(): string {
    return this.mapPath
  }

}
