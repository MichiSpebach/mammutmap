import * as util from './util'
import { Path } from './Path'
import { BoxData } from './BoxData'

export abstract class Box {
  private readonly path: Path
  private readonly id: string
  private widthInPercent: number = 0
  private heightInPercent: number = 0
  private metaData: BoxData|null = null

  public constructor(path: Path, id: string) {
    this.path = path
    this.id = id
  }

  protected getPath(): Path {
    return this.path
  }

  protected getId(): string {
    return this.id
  }

  public render(widthInPercent: number, heightInPercent: number): void {
    this.widthInPercent = widthInPercent
    this.heightInPercent = heightInPercent

    this.loadAndProcessMetaData()
    this.renderHeader()
    this.renderBody()
  }

  private async loadAndProcessMetaData():Promise<void> {
    //let data: string = await util.readFile('wip')
    this.renderStyle()
  }

  private renderStyle(): void {
    let basicStyle: string = 'display:inline-block;overflow:hidden;'//auto;'
    let scaleStyle: string = 'width:' + this.widthInPercent + '%;height:' + this.heightInPercent + '%;'
    let borderStyle: string = this.getBorderStyle()

    util.setStyleTo(this.getId(), basicStyle + scaleStyle + borderStyle)
  }

  protected abstract getBorderStyle(): string

  private renderHeader(): void {
    let headerElement: string = '<div style="background-color:skyblue;">' + this.path.getSrcName() + '</div>'
    util.setContentTo(this.getId(), headerElement)
  }

  protected abstract renderBody(): void

  /*private renderBody(): void {
    util.addContentTo(this.getId(), this.formBody())
  }

  protected abstract formBody(): string*/

}
