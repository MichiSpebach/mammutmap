import { renderManager } from '../RenderManager'
import { NodeWidget } from '../node/NodeWidget'
import { Widget } from '../Widget'
import { NodeData } from '../mapData/NodeData'

export class BoxNodesWidget extends Widget {
    private readonly id: string
    private readonly nodeDatas: NodeData[]
    private readonly onNodeDatasChanged: () => Promise<void>
    private nodeWidgets: NodeWidget[] = []
    private rendered: boolean = false

    public constructor(id: string, nodeDatas: NodeData[], onNodeDatasChanged: () => Promise<void>) {
      super()
      this.id = id
      this.nodeDatas = nodeDatas
      this.onNodeDatasChanged = onNodeDatasChanged
    }

    public getId(): string {
      return this.id
    }

    public async render(): Promise<void> {
      if (this.rendered) {
        return
      }

      for (const data of this.nodeDatas) {
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
      this.nodeDatas.push(data)

      if (!this.rendered) {
        return
      }

      const nodeWidget: NodeWidget = new NodeWidget(data)
      this.nodeWidgets.push(nodeWidget)
      
      await renderManager.addContentTo(this.getId(), this.formHtmlPlaceholderFor(nodeWidget))
      await nodeWidget.render()
      await this.onNodeDatasChanged()
    }

    private formHtmlPlaceholderFor(node: NodeWidget): string {
      return `<div id="${node.getId()}"></div>`
    }

}