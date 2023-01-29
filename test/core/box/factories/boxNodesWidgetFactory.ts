import { Box } from '../../../../src/core/box/Box'
import { BoxNodesWidget } from '../../../../src/core/box/BoxNodesWidget'


export function of(referenceBox: Box): BoxNodesWidget {
    // TODO: implement this a little bit more deeply to be usable for more cases
    const boxNodesWidget: BoxNodesWidget = {} as any
    boxNodesWidget.getNodeById = (id: string) => undefined
    return boxNodesWidget
}