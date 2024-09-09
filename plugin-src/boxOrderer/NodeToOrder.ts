import { Box, LocalPosition, NodeWidget } from '../../dist/pluginFacade'

export type NodeToOrder = {
	node: Box|NodeWidget
	wishPosition: LocalPosition
}