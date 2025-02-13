import { renderManager, RenderPriority } from '../renderEngine/renderManager'
import * as indexHtmlIds from '../indexHtmlIds'
import { LocalPosition } from '../shape/LocalPosition'

class Layer {
  public rendered: boolean = false
  
  public constructor(
    public readonly id: string,
    private readonly lines: number[],
    private readonly color: string,
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
  
  public formColumns(): string {
    const columns: string = this.formLayerLines(this.lines, 'left', 'width:0.5px;height:100%;')
    const displayStyle = this.active ? '' : 'display:none;'
    return `<div id="${this.id}" style="${displayStyle}position:absolute;width:100%;height:100%">${columns}</div>`
  }

  public formRows(): string {
    const rows: string = this.formLayerLines(this.lines, 'top', 'width:100%;height:0.5px;')
    const displayStyle = this.active ? '' : 'display:none;'
    return `<div id="${this.id}" style="${displayStyle}position:absolute;width:100%;height:100%">${rows}</div>`
  }

  private formLayerLines(steps: number[], startingEdge: 'left'|'top', sizeStyle: string): string {
    let lines: string = ''
    for (const step of steps) {
      lines += `<div style="position:absolute;${startingEdge}:${step}%;${sizeStyle}background-color:${this.color};"></div>`
    }
    return lines
  }
}

export class Grid {

  private static readonly layerLines: number[][] = [
    [50],
    [24, 76],
    [8, 16, 32, 40, 60, 68, 84, 92],
    [4, 12, 20, 28, 36, 44, 56, 64, 72, 80, 88, 96],
    [2, 6, 10, 14, 18, 22, 26, 30, 34, 38, 42, 46, 48, 52, 54, 58, 62, 66, 70, 74, 78, 82, 86, 90, 94, 98],
    Array.from({length: 50}, (_, index) => (index+1)*2 -1)
  ]

  private readonly id: string = 'grid'
  private readonly layers: {columns: Layer, rows: Layer}[] = [
    {columns: new Layer(this.id+'Layer0Columns', Grid.layerLines[0], '#aaaa', true), rows: new Layer(this.id+'Layer0Rows', Grid.layerLines[0], '#aaaa', true)},
    {columns: new Layer(this.id+'Layer1Columns', Grid.layerLines[1], '#8888', true), rows: new Layer(this.id+'Layer1Rows', Grid.layerLines[1], '#8888', true)},
    {columns: new Layer(this.id+'Layer2Columns', Grid.layerLines[2], '#8888', true), rows: new Layer(this.id+'Layer2Rows', Grid.layerLines[2], '#8888', true)},
    {columns: new Layer(this.id+'Layer3Columns', Grid.layerLines[3], '#8882', true), rows: new Layer(this.id+'Layer3Rows', Grid.layerLines[3], '#8882', true)},
    {columns: new Layer(this.id+'Layer4Columns', Grid.layerLines[4], '#8882', true), rows: new Layer(this.id+'Layer4Rows', Grid.layerLines[4], '#8882', true)},
    {columns: new Layer(this.id+'Layer5Columns', Grid.layerLines[5], '#8881', true), rows: new Layer(this.id+'Layer5Rows', Grid.layerLines[5], '#8881', true)}
  ]
  private activeLayers: {columns: 0|1|2|3|4|5, rows: 0|1|2|3|4|5} = {columns: 4, rows: 4}

  private idRenderedInto: string|null = null

  public getIdRenderedInto(): string|null {
    return this.idRenderedInto
  }

  public async renderInto(idToRenderInto: string, priority: RenderPriority): Promise<void> {
    if (!this.idRenderedInto) {
      this.idRenderedInto = idToRenderInto
      const style: string = 'position:absolute;width:100%;height:100%;'
      const layersHtml: string = this.layers.map(layer => layer.columns.formColumns() + layer.rows.formRows()).join('')
      const html: string = '<div id="'+this.id+'" style="'+style+'">'+layersHtml+'</div>'
      for (const layer of this.layers) {
        layer.columns.rendered = true
        layer.rows.rendered = true
      }
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

  public async updateActiveLayers(renderedIntoElementSizeInPixels: {width: number, height: number}) {
    await this.setActiveLayers(Grid.getActiveLayersForSize(renderedIntoElementSizeInPixels))
  }

  private static getActiveLayersForSize(sizeInPixels: {width: number, height: number}): {columns: 0|1|2|3|4|5, rows: 0|1|2|3|4|5} {
    return {
      columns: Grid.getActiveLayersForScalar((sizeInPixels.width*2 + sizeInPixels.height) / 3),
      rows: Grid.getActiveLayersForScalar((sizeInPixels.height*2 + sizeInPixels.width) / 3)
    }
  }

  private static getActiveLayersForScalar(sizeInPixels: number): 0|1|2|3|4|5 {
    if (sizeInPixels > 2500) {
      return 5
    }
    if (sizeInPixels > 1250) {
      return 4
    }
    if (sizeInPixels > 800) {
      return 3
    }
    if (sizeInPixels > 400) {
      return 2
    }
    if (sizeInPixels > 300) {
      return 1
    }
    return 0
  }

  private async setActiveLayers(activeLayers: {columns: 0|1|2|3|4|5, rows: 0|1|2|3|4|5}): Promise<void> {
    this.activeLayers = activeLayers
    const pros: Promise<void>[] = []
    for (let i=0; i < this.layers.length; i++) {
      pros.push(this.layers[i].columns.setActive(i <= activeLayers.columns))
      pros.push(this.layers[i].rows.setActive(i <= activeLayers.rows))
    }
    await Promise.all(pros)
  }

  public roundToGridPosition(position: LocalPosition): LocalPosition {
    return new LocalPosition(
      this.roundToGridPositionX(position.percentX),
      this.roundToGridPositionY(position.percentY)
    )
  }

  public static roundToGridPosition(position: LocalPosition, sizeInPixels: {width: number, height: number}, clipOverflow: boolean): LocalPosition {
    const activeLayers: {columns: 0|1|2|3|4|5, rows: 0|1|2|3|4|5} = Grid.getActiveLayersForSize(sizeInPixels)
    return new LocalPosition(
      Grid.roundToLayerGridScalar(position.percentX, activeLayers.columns, clipOverflow),
      Grid.roundToLayerGridScalar(position.percentY, activeLayers.rows, clipOverflow)
    )
  }

  public roundToGridPositionX(positionX: number): number {
    return Grid.roundToLayerGridScalar(positionX, this.activeLayers.columns)
  }

  public roundToGridPositionY(positionY: number): number {
    return Grid.roundToLayerGridScalar(positionY, this.activeLayers.rows)
  }

  private static roundToLayerGridScalar(position: number, layer: 0|1|2|3|4|5, clipOverflow?: boolean): number {
    let nearestGridPosition: number = 50

    const stepSize: number = this.getStepSizeOfLayer(layer)
    let gridPosition: number
    if (position <= 50) {
      gridPosition = Math.round(position/stepSize) * stepSize
    } else {
      // matters if stepSize is not dividable by 100 (e.g. 8), lines start from borders TODO: start lines from center instead?
      gridPosition = Math.round((100-position) / stepSize) * stepSize
      gridPosition = 100-gridPosition
    }
    if (stepSize > 2) {
      if (gridPosition === 48 || gridPosition === 52) {
        gridPosition = 50
      }
    }
    if (Math.abs(position-gridPosition) < Math.abs(position-nearestGridPosition)) {
      nearestGridPosition = gridPosition
    }
    if (clipOverflow) {
      nearestGridPosition = Math.min(nearestGridPosition, 100)
      nearestGridPosition = Math.max(nearestGridPosition, 0)
    }

    return nearestGridPosition
  }

  public static getStepSizeOfLayer(layer: number): number {
    if (layer === 0) {
      return 50
    }
    if (layer === 1) {
      return 24
    }
    return 32 / Math.pow(2, layer)
  }

}

export const grid = new Grid()
