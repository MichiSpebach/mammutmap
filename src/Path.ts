
export class Path { // TODO: extract readonly interface "PathReader" asa setters are added
  private parent: Path | null //{srcRootPath: string, mapRootPath: string}
  private srcName: string
  private mapName: string

  public static buildRoot(srcName: string, mapName: string): Path {
    return new Path(null, srcName, mapName)
  }

  public static buildDirEntry(parent: Path, name: string): Path {
    return new Path(parent, name, name)
  }

  private constructor(parent: Path | null, srcName: string, mapName: string) {
    this.parent = parent
    this.srcName = srcName
    this.mapName = mapName
  }

  public getSrcName(): string {
    return this.srcName
  }

  public getSrcPath(): string {
    return this.getPath(this.srcName, () => this.parent!.getSrcPath())
  }

  public getMapPath(): string {
    return this.getPath(this.mapName, () => this.parent!.getMapPath())
  }

  private getPath(name: string, getParentPath: () => string): string {
    if (this.parent == null) {
      return name
    }
    return getParentPath() + '/' + name
  }

}
