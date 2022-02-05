import { renderManager, RenderPriority } from '../RenderManager'
import * as indexHtmlIds from '../indexHtmlIds'

class Grid {

  private static readonly layer1Steps: number[] = [
    0, 4, 8, 12, 16, 20, 24, 28, 32, 36, 40, 44, 50, 56, 60, 64, 68, 72, 76, 80, 84, 88, 92, 96, 100
  ]

  private readonly id: string = 'grid'
  private readonly idLayer1Columns: string = this.id+'Layer1Columns'
  private readonly idLayer1Rows: string = this.id+'Layer1Rows'

  private idRenderedInto: string|null = null
  //private layer2ColumnsRendered: boolean = false // TODO: implement depending on current clientRectSize
  //private layer2RowsRendered: boolean = false

  public async renderInto(idToRenderInto: string, priority: RenderPriority): Promise<void> {
    if (!this.idRenderedInto) {
      this.idRenderedInto = idToRenderInto
      const style: string = 'position:absolute;width:100%;height:100%;'
      const html: string = '<div id="'+this.id+'" style="'+style+'">'+this.formLayer1Columns()+this.formLayer1Rows()+'</div>'
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

  private formLayer1Columns(): string {
    return this.formLayerLines(this.idLayer1Columns, Grid.layer1Steps, 'left', 'width:1px;height:100%;')
  }

  private formLayer1Rows(): string {
    return this.formLayerLines(this.idLayer1Rows, Grid.layer1Steps, 'top', 'width:100%;height:1px;')
  }

  private formLayerLines(id: string, steps: number[], startingEdge: 'left'|'top', sizeStyle: string): string {
    let lines: string = ''
    for (const step of steps) {
      if (step === 0 || step === 100) {
        continue
      }
      lines += `<div style="position:absolute;${startingEdge}:${step}%;${sizeStyle}background-color:#aaa8;"></div>`
    }
    return '<div id="'+id+'" style="position:absolute;width:100%;height:100%">'+lines+'</div>'
  }

  public roundToGridPosition(position: number): number {
    let nearestGridPosition: number = 50

    for (const gridPosition of Grid.layer1Steps) {
      if (Math.abs(position-gridPosition) < Math.abs(position-nearestGridPosition)) {
        nearestGridPosition = gridPosition
      }
    }

    return nearestGridPosition
  }

}

export const grid = new Grid()
