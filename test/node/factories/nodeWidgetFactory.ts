import { Box } from '../../../src/box/Box'
import { NodeData } from '../../../src/mapData/NodeData'
import { NodeWidget } from '../../../src/node/NodeWidget'

export function of(id: string, managingBox: Box): NodeWidget {
    const mapData = new NodeData(id, 80, 20)
    const node = new NodeWidget(mapData, managingBox)
    return node
}
