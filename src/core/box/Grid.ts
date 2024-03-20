import { renderManager, RenderPriority } from '../RenderManager'
import * as indexHtmlIds from '../indexHtmlIds'
import { LocalPosition } from '../shape/LocalPosition'

class Layer {
  public rendered: boolean = false
  
  public constructor(
    public readonly id: string,
    private active: boolean
  ) {}

  public async setActive(active: boolean): Promise<void> {
    if (active === this.active) {
      return
    }
    this.active = active
    if (this.rendered) {
      await renderManager.addStyleTo(this.id, {display: active ? null : 'none'})
    }
  }
  
  public formColumns(layerLines: number[], color: string): string {
    const columns: string = this.formLayerLines(layerLines, 'left', 'width:0.5px;height:100%;', color)
    const displayStyle = this.active ? '' : 'display:none;'
    return `<div id="${this.id}" style="${displayStyle}position:absolute;width:100%;height:100%">${columns}</div>`
  }

  public formRows(layerLines: number[], color: string): string {
    const rows: string = this.formLayerLines(layerLines, 'top', 'width:100%;height:0.5px;', color)
    const displayStyle = this.active ? '' : 'display:none;'
    return `<div id="${this.id}" style="${displayStyle}position:absolute;width:100%;height:100%">${rows}</div>`
  }

  private formLayerLines(steps: number[], startingEdge: 'left'|'top', sizeStyle: string, color: string): string {
    let lines: string = ''
    for (const step of steps) {
      lines += `<div style="position:absolute;${startingEdge}:${step}%;${sizeStyle}background-color:${color};"></div>`
    }
    return lines
  }
}

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
  private readonly layers: {columns: Layer, rows: Layer}[] = [
    {columns: new Layer(this.id+'Layer0Columns', true), rows: new Layer(this.id+'Layer0Rows', true)},
    {columns: new Layer(this.id+'Layer1Columns', true), rows: new Layer(this.id+'Layer1Rows', true)},
  ]
  private activeLayers: {columns: 0|1, rows: 0|1} = {columns: 1, rows: 1}

  private idRenderedInto: string|null = null

  public async setActiveLayers(activeLayers: {columns: 0|1, rows: 0|1}): Promise<void> {
    this.activeLayers = activeLayers
    const pros: Promise<void>[] = []
    for (let i=0; i < this.layers.length; i++) {
      pros.push(this.layers[i].columns.setActive(i <= activeLayers.columns))
      pros.push(this.layers[i].rows.setActive(i <= activeLayers.rows))
    }
    await Promise.all(pros)
  }

  public async renderInto(idToRenderInto: string, priority: RenderPriority): Promise<void> {
    if (!this.idRenderedInto) {
      this.idRenderedInto = idToRenderInto
      const style: string = 'position:absolute;width:100%;height:100%;'
      const layer0Html: string = this.layers[0].columns.formColumns(Grid.layer0Lines, '#8888') + this.layers[0].rows.formRows(Grid.layer0Lines, '#8888')
      const layer1Html: string = this.layers[1].columns.formColumns(Grid.layer1Lines, '#8882') + this.layers[1].rows.formRows(Grid.layer1Lines, '#8882')
      const html: string = '<div id="'+this.id+'" style="'+style+'">'+layer0Html+layer1Html+'</div>'
      await renderManager.setContentTo(idToRenderInto, html, priority)
      this.layers[0].columns.rendered = true // TODO: implement active depending on current clientRectSize of renderedIntoBox
      this.layers[0].rows.rendered = true
      this.layers[1].columns.rendered = true
      this.layers[1].rows.rendered = true
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

  public roundToGridPosition(position: LocalPosition): LocalPosition {
    return new LocalPosition(
      this.roundToGridPositionX(position.percentX),
      this.roundToGridPositionY(position.percentY)
    )
  }

  public roundToGridPositionX(positionX: number): number {
    return Grid.roundToLayerGridScalar(positionX, this.activeLayers.columns)
  }

  public roundToGridPositionY(positionY: number): number {
    return Grid.roundToLayerGridScalar(positionY, this.activeLayers.rows)
  }

  private static roundToLayerGridScalar(position: number, layer: 0|1): number {
    let nearestGridPosition: number = 50

    const stepSize: number = this.getStepSizeOfLayer(layer)
    const gridPosition: number = Math.round(position/stepSize) * stepSize
    if (Math.abs(position-gridPosition) < Math.abs(position-nearestGridPosition)) {
      nearestGridPosition = gridPosition
    }

    return nearestGridPosition
  }

}

export const grid = new Grid()
