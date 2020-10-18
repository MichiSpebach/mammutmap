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

  public getPath(): string {
    if (this.parent == null) {
      return this.name
    }
    return this.parent.getPath() + '/' + this.name
  }

  public render(widthInPercent: number, heightInPercent: number): void {
    this.widthInPercent = widthInPercent
    this.heightInPercent = heightInPercent

    this.renderStyle()
    this.renderHeader()
    this.renderBody()
  }

  private renderStyle(): void {
    let basicStyle: string = 'display:inline-block;overflow:hidden;'//auto;'
    let scaleStyle: string = 'width:' + this.widthInPercent + '%;height:' + this.heightInPercent + '%;'
    let borderStyle: string = this.getBorderStyle()

    util.setStyleTo(this.getId(), basicStyle + scaleStyle + borderStyle)
  }

  protected abstract getBorderStyle(): string

  private renderHeader(): void {
    let headerElement: string = '<div style="background-color:skyblue;">' + this.name + '</div>'
    util.setContentTo(this.getId(), headerElement)
  }

  protected abstract renderBody(): void

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

}
