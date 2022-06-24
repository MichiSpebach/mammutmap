import { Box } from '../../../src/box/Box'
import { BoxNodesWidget } from '../../../src/box/BoxNodesWidget'


export function of(referenceBox: Box): BoxNodesWidget {
    // TODO: implement this a little bit more deeply to be usable for more cases
    const boxNodesWidget: BoxNodesWidget = {} as any
    boxNodesWidget.getNodeById = (id: string) => undefined
    return boxNodesWidget
}