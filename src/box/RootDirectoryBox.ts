import { DirectoryBox } from './DirectoryBox'

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

  protected async loadMapData():Promise<void> {
    // root folder has no mapData
  }

}
