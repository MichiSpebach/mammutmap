import { LocalPosition } from '../../src/core/shape/LocalPosition'
import { BorderLayer } from './BorderLayer'
import * as boxFactory from '../../test/core/box/factories/boxFactory'
import * as testUtil from '../../test/testUtil'
import { RootFolderBox } from '../../src/core/box/RootFolderBox'
import { FolderBox } from '../../src/core/box/FolderBox'
import { FileBox } from '../../src/core/box/FileBox'
import { BoxData } from '../../src/core/mapData/BoxData'
import { NodeWidget } from '../../src/core/node/NodeWidget'
import { NodeData } from '../../src/core/mapData/NodeData'

test('new() transforms intersections correctly', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: BoxData.buildNew(20, 20, 60, 60), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	
	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(50, 0)}, to: folderToOrder, save: true})
	await rootFolder.links.add({
		from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(0, 20)},
		to: {node: folderToOrder, positionInToNodeCoords: new LocalPosition(0, 0)},
		save: true
	})
	
	const layer = await BorderLayer.new(folderToOrder)
	
	expect(layer.topBorderingLinks.map(borderingLinkWithIntersection => borderingLinkWithIntersection.intersection)).toEqual([new LocalPosition(50, 0)])
	expect(layer.leftBorderingLinks.map(borderingLinkWithIntersection => borderingLinkWithIntersection.intersection)).toEqual([new LocalPosition(0, 0)])
})

test('addNodeIfFitting() adds NodeWidgets but not Boxes', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: 'folderToOrder', parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const file: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNew(40, 45, 20, 10), parent: folderToOrder, addToParent: true})
	const nodeWidget: NodeWidget = await folderToOrder.nodes.add(NodeData.buildNew(50, 0))
	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(50, 0)}, to: file, save: true})
	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(50, 0)}, to: nodeWidget, save: true})

	const layer = await BorderLayer.new(folderToOrder)

	expect(layer.topBorderingLinks.length).toBe(2)
	expect(layer.rightBorderingLinks.length).toBe(0)
	expect(layer.bottomBorderingLinks.length).toBe(0)
	expect(layer.leftBorderingLinks.length).toBe(0)
	expect((await layer.addNodeIfFitting(file)).added).toBe(false)
	expect((await layer.addNodeIfFitting(nodeWidget)).added).toBe(true)

	expect(layer.getSuggestions().map(suggestion => ({...suggestion, node: suggestion.node.getId()}))).toEqual([
		{node: nodeWidget.getId(), suggestedPosition: new LocalPosition(50, 0)}
	])
})

test('BorderLayer two nodes on same side', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: 'folderToOrder', parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const nodeWidget: NodeWidget = await folderToOrder.nodes.add(NodeData.buildNew(80, 5))
	const otherNodeWidget: NodeWidget = await folderToOrder.nodes.add(NodeData.buildNew(100, 50))
	await rootFolder.links.add({from: nodeWidget, to: {node: rootFolder, positionInToNodeCoords: new LocalPosition(100, 50)}, save: true})
	await rootFolder.links.add({from: otherNodeWidget, to: {node: rootFolder, positionInToNodeCoords: new LocalPosition(100, 50)}, save: true})

	const layer = await BorderLayer.new(folderToOrder)

	expect(layer.topBorderingLinks.length).toBe(0)
	expect(layer.rightBorderingLinks.length).toBe(2)
	expect(layer.bottomBorderingLinks.length).toBe(0)
	expect(layer.leftBorderingLinks.length).toBe(0)
	expect((await layer.addNodeIfFitting(nodeWidget)).added).toBe(true)
	expect((await layer.addNodeIfFitting(otherNodeWidget)).added).toBe(true)

	expect(layer.getSuggestions().map(suggestion => ({...suggestion, node: suggestion.node.getId()}))).toEqual([
		{node: nodeWidget.getId(), suggestedPosition: new LocalPosition(100, 46)},
		{node: otherNodeWidget.getId(), suggestedPosition: new LocalPosition(100, 54)}
	])
})

test('intersection works for nodeWidget on border in rounded box', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const roundedFolder: FolderBox =  boxFactory.folderOf({idOrData: BoxData.buildNewWithId(`roundedFolder`, 100/3, 100/7, 100/3, 100/9), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: 'folderToOrder', parent: roundedFolder, addToParent: true, rendered: true, bodyRendered: true})
	const nodeWidget: NodeWidget = await folderToOrder.nodes.add(NodeData.buildNew(0, 50))

	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(0, 50)}, to: nodeWidget, save: true})

	const layer = await BorderLayer.new(folderToOrder)

	expect(layer.topBorderingLinks.length).toBe(0)
	expect(layer.rightBorderingLinks.length).toBe(0)
	expect(layer.bottomBorderingLinks.length).toBe(0)
	expect(layer.leftBorderingLinks.length).toBe(1)
	expect((await layer.addNodeIfFitting(nodeWidget)).added).toBe(true)

	expect(layer.getSuggestions().map(suggestion => ({...suggestion, node: suggestion.node.getId()}))).toEqual([
		{node: nodeWidget.getId(), suggestedPosition: new LocalPosition(0, 96)}
	])
})

test('nodeWidget flows to nearer side if link intersects two sides', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: 'folderToOrder', parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const nodeWidget: NodeWidget = await folderToOrder.nodes.add(NodeData.buildNew(100, 50))
	const otherNodeWidget: NodeWidget = await folderToOrder.nodes.add(NodeData.buildNew(0, 50))

	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(0, 50)}, to: nodeWidget, save: true})
	await rootFolder.links.add({from: otherNodeWidget, to: {node: rootFolder, positionInToNodeCoords: new LocalPosition(100, 50)}, save: true})

	const layer = await BorderLayer.new(folderToOrder)

	expect((await layer.addNodeIfFitting(nodeWidget)).added).toBe(true)
	expect((await layer.addNodeIfFitting(otherNodeWidget)).added).toBe(true)

	expect(layer.getSuggestions().map(suggestion => ({...suggestion, node: suggestion.node.getId()}))).toEqual([
		{node: otherNodeWidget.getId(), suggestedPosition: new LocalPosition(100, 50)},
		{node: nodeWidget.getId(), suggestedPosition: new LocalPosition(0, 50)}
	])
})