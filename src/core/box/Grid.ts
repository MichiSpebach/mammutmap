import { renderManager, RenderPriority } from '../RenderManager'
import * as indexHtmlIds from '../indexHtmlIds'
import { LocalPosition } from '../shape/LocalPosition'

export class Grid {

  public static getStepSizeOfLayer(layer: number): number {
    return 4 / Math.pow(2, layer)
  }

  private static readonly layer0Lines: number[] = [
    4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 48, 50, 52, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96
  ]
  private static readonly layer1Lines: number[] = [
    2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 54, 58, 62, 66, 70, 74, 78, 82, 86, 90, 94, 98
  ]

  private readonly id: string = 'grid'
  private readonly idLayer0: string = this.id+'Layer0'
  private readonly idLayer1: string = this.id+'Layer1'

  private idRenderedInto: string|null = null
  //private layer2ColumnsRendered: boolean = false // TODO: implement depending on current clientRectSize
  //private layer2RowsRendered: boolean = false

  public async renderInto(idToRenderInto: string, priority: RenderPriority): Promise<void> {
    if (!this.idRenderedInto) {
      this.idRenderedInto = idToRenderInto
      const style: string = 'position:absolute;width:100%;height:100%;'
      const layer0Html: string = this.formLayer(this.idLayer0, Grid.layer0Lines, '#8888')
      const layer1Html: string = this.formLayer(this.idLayer1, Grid.layer1Lines, '#8882')
      const html: string = '<div id="'+this.id+'" style="'+style+'">'+layer0Html+layer1Html+'</div>'
      await renderManager.setContentTo(idToRenderInto, html, priority)
    } else if (this.idRenderedInto !== idToRenderInto) {
      this.idRenderedInto = idToRenderInto
      await renderManager.appendChildTo(idToRenderInto, this.id, priority)
    }
  }

  public async unrenderFrom(idToUnrenderFrom: string, priority: RenderPriority): Promise<void> {
    if (this.idRenderedInto !== idToUnrenderFrom) {
      return
    }
    this.idRenderedInto = indexHtmlIds.unplacedElementsId
    await renderManager.appendChildTo(indexHtmlIds.unplacedElementsId, this.id, priority)
  }

  private formLayer(layerId: string, layerLines: number[], color: string): string {
    const columns: string = this.formLayerLines(layerLines, 'left', 'width:0.5px;height:100%;', color)
    const rows: string = this.formLayerLines(layerLines, 'top', 'width:100%;height:0.5px;', color)
    return '<div id="'+layerId+'" style="position:absolute;width:100%;height:100%">'+columns+rows+'</div>'
  }

  private formLayerLines(steps: number[], startingEdge: 'left'|'top', sizeStyle: string, color: string): string {
    let lines: string = ''
    for (const step of steps) {
      lines += `<div style="position:absolute;${startingEdge}:${step}%;${sizeStyle}background-color:${color};"></div>`
    }
    return lines
  }

  public roundToGridPosition(position: LocalPosition): LocalPosition {
    return new LocalPosition(
      this.roundToGridScalar(position.percentX),
      this.roundToGridScalar(position.percentY)
    )
  }

  public roundToGridScalar(position: number): number {
    return Grid.roundToLayer1GridScalar(position)
  }

  private static roundToLayer1GridScalar(position: number): number {
    let nearestGridPosition: number = 50

    const stepSize: number = this.getStepSizeOfLayer(1)
    const gridPosition: number = Math.round(position/stepSize) * stepSize
    if (Math.abs(position-gridPosition) < Math.abs(position-nearestGridPosition)) {
      nearestGridPosition = gridPosition
    }

    return nearestGridPosition
  }

}

export const grid = new Grid()
