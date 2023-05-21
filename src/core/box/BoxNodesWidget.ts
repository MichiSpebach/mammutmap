import { renderManager } from '../RenderManager'
import { NodeWidget } from '../node/NodeWidget'
import { Widget } from '../Widget'
import { NodeData } from '../mapData/NodeData'
import { Box } from './Box'
import { util } from '../util/util'
import { relocationDragManager } from '../RelocationDragManager'

export class BoxNodesWidget extends Widget {
    private readonly referenceBox: Box
    private nodeWidgets: NodeWidget[] = []
    private rendered: boolean = false

    public constructor(referenceBox: Box) {
      super()
      this.referenceBox = referenceBox
    }

    public getId(): string {
      return this.referenceBox.getId()+'Nodes'
    }

    public getNodeById(id: string): NodeWidget|undefined {
      return this.nodeWidgets.find(node => node.getId() === id)
    }

    public getNodes(): NodeWidget[] {
      return this.nodeWidgets
    }

    public async render(): Promise<void> {
      if (this.rendered) {
        return
      }

      for (const nodeData of this.referenceBox.getMapNodeData()) {
        if (this.nodeWidgets.find(nodeWidget => nodeWidget.getId() === nodeData.id)) {
          continue
        }
        this.nodeWidgets.push(new NodeWidget(nodeData, this.referenceBox))
      }

      const nodePlaceholders: string = this.nodeWidgets
        .filter(node => !node.isBeingRendered()) // this happens for nodes that where dropped in when this was not rendered
        .reduce<string>((placeholders, node) => placeholders += this.formHtmlPlaceholderFor(node), '')
      await renderManager.addContentTo(this.getId(), nodePlaceholders)

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

    public static async changeManagingBoxOfNodeAndSave(oldManagingBox: Box, newManagingBox: Box, node: NodeWidget): Promise<void> {
      if (node.getManagingBox() !== newManagingBox) {
        util.logWarning('managingBox '+node.getManagingBox().getSrcPath()+' of given node '+node.getId()+' does not match newManagingBox '+newManagingBox.getSrcPath())
      }
      if (newManagingBox.nodes.nodeWidgets.includes(node)) {
        util.logWarning('box '+newManagingBox.getSrcPath()+' already manages node '+node.getId())
      }
      if (!oldManagingBox.nodes.nodeWidgets.includes(node)) {
        util.logWarning('box '+oldManagingBox.getSrcPath()+' does not manage node '+node.getId())
      }
      const proms: Promise<any>[] = []

      newManagingBox.nodes.nodeWidgets.push(node)
      proms.push(renderManager.appendChildTo(newManagingBox.nodes.getId(), node.getId()))
      oldManagingBox.nodes.nodeWidgets.splice(oldManagingBox.nodes.nodeWidgets.indexOf(node), 1)

      newManagingBox.getMapNodeData().push(node.getMapData())
      oldManagingBox.getMapNodeData().splice(oldManagingBox.getMapNodeData().indexOf(node.getMapData()), 1)
      proms.push(newManagingBox.saveMapData())
      proms.push(oldManagingBox.saveMapData())

      await Promise.all(proms)
    }

    public async add(data: NodeData): Promise<void> {
      this.referenceBox.getMapNodeData().push(data)

      const nodeWidget: NodeWidget = new NodeWidget(data, this.referenceBox)
      this.nodeWidgets.push(nodeWidget)
      await renderManager.addContentTo(this.getId(), this.formHtmlPlaceholderFor(nodeWidget))
      await nodeWidget.render()

      await this.referenceBox.saveMapData()
    }

    private formHtmlPlaceholderFor(node: NodeWidget): string {
      const draggableHtml: string = relocationDragManager.isUsingNativeDragEvents() ? 'draggable="true"' : ''
      return `<div id="${node.getId()}" ${draggableHtml}></div>`
    }

}
