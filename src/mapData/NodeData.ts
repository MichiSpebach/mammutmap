import { util } from '../util'
import { JsonObject } from '../JsonObject'

export class NodeData extends JsonObject {
    public readonly id: string
    public x: number
    public y: number

    public static buildNew(x: number, y: number): NodeData {
        return new NodeData(util.generateId(), x, y)
    }

    public static buildFromRawObject(object: any): NodeData {
        // TODO: implement validate like in BoxMapData to warn when loaded data is corrupted
        return new NodeData(object.id, object.x, object.y) // raw object would have no methods
    }

    public constructor(id: string, x: number, y: number) {
        super()
        this.id = id
        this.x = x
        this.y = y
    }

}