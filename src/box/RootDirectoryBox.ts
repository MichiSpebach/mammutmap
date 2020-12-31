import { DirectoryBox } from './DirectoryBox'
import { BoxMapData } from './BoxMapData'

export class RootDirectoryBox extends DirectoryBox {

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
