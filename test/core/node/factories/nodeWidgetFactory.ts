import { Box } from '../../../../src/core/box/Box'
import { NodeData } from '../../../../src/core/mapData/NodeData'
import { NodeWidget } from '../../../../src/core/node/NodeWidget'

export function of(id: string, managingBox: Box): NodeWidget {
    const mapData = new NodeData(id, 80, 20)
    const node = new NodeWidget(mapData, managingBox)
    return node
}
