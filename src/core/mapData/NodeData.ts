import { util } from '../util'
import { JsonObject } from '../JsonObject'
import { LocalPosition } from '../shape/LocalPosition'

export class NodeData extends JsonObject {
    public readonly id: string
    public x: number
    public y: number

    public static buildNew(x: number, y: number): NodeData {
        return new NodeData(util.generateId(), x, y)
    }

    public static buildFromRawObject(object: any): NodeData {
        const nodeData: NodeData = Object.setPrototypeOf(object, NodeData.prototype) // raw object would have no methods
        nodeData.validate()
        return nodeData
    }

    public constructor(id: string, x: number, y: number) {
        super()
        this.id = id
        this.x = x
        this.y = y

        this.validate()
    }

    private validate(): void {
        if (!this.id || this.id.length === 0) {
            util.logWarning('NodeData::id is undefined or null or has length 0.')
        }

        if (this.x === undefined || this.x === null) {
            util.logWarning('NodeData::x is undefined or null.')
        } else if (this.x < 0 || this.x > 100) {
            // TODO: sometimes there is a difference of epsilon, reactivate as soon as values are rounded before save
            //util.logWarning(`expected NodeData::x to be between 0 and 100 but it is ${this.x}.`)
        }

        if (this.y === undefined || this.y === null) {
            util.logWarning('NodeData::y is undefined or null.')
        } else if (this.y < 0 || this.y > 100) {
            // TODO: sometimes there is a difference of epsilon, reactivate as soon as values are rounded before save
            //util.logWarning(`expected NodeData::y to be between 0 and 100 but it is ${this.y}.`)
        }
    }

    public getPosition(): LocalPosition {
        return new LocalPosition(this.x, this.y)
    }

    public setPosition(position: LocalPosition): void {
        this.x = position.percentX
        this.y = position.percentY
    }

}