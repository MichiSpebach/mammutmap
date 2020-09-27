import * as util from './util'

export abstract class Box {
  private parent: Box|null // TODO: introduce Path instead of parent and name
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
    if (this.parent == null) {
      return this.name
    }
    return this.parent.getPath() + '/' + this.name
  }

  public abstract render(widthInPercent: number, heightInPercent: number): void

  protected renderHeader(): void {
    let headerElement: string = '<div style="background-color:skyblue;">' + this.getName() + '</div>'
    util.setContentTo(this.getId(), headerElement)
  }

}
