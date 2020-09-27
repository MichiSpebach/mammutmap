export abstract class Box {
  private parent: Box|null
  private name: string
  private id: string
  private widthInPercent: number = 0
  private heightInPercent: number = 0

  public constructor(parent: Box|null, name: string, id: string) {
    this.parent = parent
    this.name = name
    this.id = id
  }

  protected getId(): string {
    return this.id
  }

  protected getName(): string {
    return this.name
  }

  protected getWidthInPercent(): number {
    return this.widthInPercent
  }

  protected setWidthInPercent(widthInPercent: number): void {
    this.widthInPercent = widthInPercent
  }

  protected getHeightInPercent(): number {
    return this.heightInPercent
  }

  protected setHeightInPercent(heightInPercent: number): void {
    this.heightInPercent = heightInPercent
  }

  public getPath(): string {
    let parentPath: string
    if (this.parent == null) {
      parentPath = './src' // TODO: refactor
    } else {
      parentPath = this.parent.getPath()
    }

    return parentPath + '/' + this.name
  }

  protected abstract render(widthInPercent: number, heightInPercent: number): void

}
