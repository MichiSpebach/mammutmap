import { renderManager } from '../RenderManager'
import { NodeWidget } from '../node/NodeWidget'
import { Widget } from '../Widget'
import { NodeData } from '../mapData/NodeData'

export class BoxNodesWidget extends Widget {
    private readonly id: string
    private readonly datas: NodeData[]
    private nodeWidgets: NodeWidget[] = []
    private rendered: boolean = false

    public constructor(id: string, data: NodeData[]) {
      super()
      this.id = id
      this.datas = data
    }

    public getId(): string {
      return this.id
    }

    public async render(): Promise<void> {
      if (this.rendered) {
        return
      }

      for (const data of this.datas) {
        this.nodeWidgets.push(new NodeWidget(data))
      }

      const nodePlaceholders: string = this.nodeWidgets.reduce<string>((placeholders, node) => placeholders += this.formHtmlPlaceholderFor(node), '')
      await renderManager.setContentTo(this.getId(), nodePlaceholders)

      await Promise.all(this.nodeWidgets.map(async (node: NodeWidget) => {
        await node.render()
      }))

      this.rendered = true
    }

    public async unrender(): Promise<void> {
      if (!this.rendered) {
        return
      }

      await Promise.all(this.nodeWidgets.map(async (node: NodeWidget) => {
        await node.unrender()
      }))
      await renderManager.setContentTo(this.getId(), '')
      this.nodeWidgets = []

      this.rendered = false
    }

    public async add(data: NodeData) {
      this.datas.push(data)

      if (!this.rendered) {
        return
      }

      const nodeWidget: NodeWidget = new NodeWidget(data)
      this.nodeWidgets.push(nodeWidget)
      
      await renderManager.addContentTo(this.getId(), this.formHtmlPlaceholderFor(nodeWidget))
      await nodeWidget.render()
    }

    private formHtmlPlaceholderFor(node: NodeWidget): string {
      return `<div id="${node.getId()}"></div>`
    }

}