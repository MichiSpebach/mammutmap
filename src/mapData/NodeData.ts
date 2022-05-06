import { util } from '../util'
import { JsonObject } from '../JsonObject'

export class NodeData extends JsonObject {
    public readonly id: string
    public x: number
    public y: number

    public static buildNew(x: number, y: number): NodeData {
        return new NodeData(util.generateId(), x, y)
    }

    public constructor(id: string, x: number, y: number) {
        super()
        this.id = id
        this.x = x
        this.y = y
    }

}