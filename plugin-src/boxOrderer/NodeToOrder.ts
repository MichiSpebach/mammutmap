import { Box, LocalPosition, NodeWidget } from '../../src/pluginFacade'

export type NodeToOrder = {
	node: Box|NodeWidget
	wishPosition: LocalPosition
}