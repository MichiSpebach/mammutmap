import { renderManager } from '../RenderManager'
import { NodeData } from '../mapData/NodeData'
import { Widget } from '../Widget'

export class NodeWidget extends Widget {
    private readonly data: NodeData

    public constructor(data: NodeData) {
        super()
        this.data = data
    }

    public getId(): string {
        return this.data.id
    }

    public async render(): Promise<void> {
        const positionStyle = `position:absolute;top:${this.data.y}%;left:${this.data.x}%;`
        const sizeStyle = 'width:10px;height:10px;transform:translate(-5px,-5px);'
        const borderStyle = 'border-style:solid;border-width:1px;border-radius:50%;'
        const colorStyle = 'border-color:grey;background-color:#0ff8;'
        await renderManager.setStyleTo(this.getId(), positionStyle+sizeStyle+borderStyle+colorStyle)
    }

    public async unrender(): Promise<void> {
        // nothing yet
    }

}