import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import { BorderLayer } from './BorderLayer'
import { InnerLayer } from './InnerLayer'
import * as boxFactory from '../linkBundler/testUtil/boxFactory'
import * as testUtil from '../linkBundler/testUtil/testUtil'
import { RootFolderBox } from '../../dist/core/box/RootFolderBox'
import { FolderBox } from '../../dist/core/box/FolderBox'
import { FileBox } from '../../dist/core/box/FileBox'
import { BoxData } from '../../dist/core/mapData/BoxData'
import { LocalRect } from '../../dist/core/LocalRect'

test('InnerLayer', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: 'folderToOrder', parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const topFiles: FileBox[] = [
		boxFactory.fileOf({idOrData: BoxData.buildNew(5, 10, 10, 10), parent: folderToOrder, addToParent: true}),
		boxFactory.fileOf({idOrData: BoxData.buildNew(45, 10, 10, 10), parent: folderToOrder, addToParent: true}),
		boxFactory.fileOf({idOrData: BoxData.buildNew(85, 10, 10, 10), parent: folderToOrder, addToParent: true}),
		boxFactory.fileOf({idOrData: BoxData.buildNew(5, 20, 10, 10), parent: folderToOrder, addToParent: true})
	]
	const rightFiles: FileBox[] = [
		boxFactory.fileOf({idOrData: BoxData.buildNew(90, 0, 10, 10), parent: folderToOrder, addToParent: true}),
		boxFactory.fileOf({idOrData: BoxData.buildNew(90, 45, 10, 10), parent: folderToOrder, addToParent: true}),
		boxFactory.fileOf({idOrData: BoxData.buildNew(90, 90, 10, 10), parent: folderToOrder, addToParent: true})
	]
	const bottomFiles: FileBox[] = [
		boxFactory.fileOf({idOrData: BoxData.buildNew(90, 80, 10, 10), parent: folderToOrder, addToParent: true}),
		boxFactory.fileOf({idOrData: BoxData.buildNew(80, 90, 10, 10), parent: folderToOrder, addToParent: true}),
		boxFactory.fileOf({idOrData: BoxData.buildNew(45, 90, 10, 10), parent: folderToOrder, addToParent: true}),
		boxFactory.fileOf({idOrData: BoxData.buildNew(5, 90, 10, 10), parent: folderToOrder, addToParent: true})
	]
	const leftFiles: FileBox[] = [
		boxFactory.fileOf({idOrData: BoxData.buildNew(5, 85, 10, 10), parent: folderToOrder, addToParent: true}),
		boxFactory.fileOf({idOrData: BoxData.buildNew(5, 45, 10, 10), parent: folderToOrder, addToParent: true}),
		boxFactory.fileOf({idOrData: BoxData.buildNew(5, 5, 10, 10), parent: folderToOrder, addToParent: true})
	]
	await Promise.all([
		Promise.all(topFiles.map(file => rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(50, 0)}, to: file, save: true}))),
		Promise.all(rightFiles.map(file => rootFolder.links.add({from: file, to: {node: rootFolder, positionInToNodeCoords: new LocalPosition(100, 50)}, save: true}))),
		Promise.all(bottomFiles.map(file => rootFolder.links.add({from: file, to: {node: rootFolder, positionInToNodeCoords: new LocalPosition(50, 100)}, save: true}))),
		Promise.all(leftFiles.map(file => rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(0, 50)}, to: file, save: true})))
	])
	
	const layer = new InnerLayer(await BorderLayer.new(folderToOrder))

	expect(await Promise.all(topFiles.map(async file => (await layer.addNodeIfFitting(file)).added))).toEqual([true, true, true, true])
	expect(await Promise.all(rightFiles.map(async file => (await layer.addNodeIfFitting(file)).added))).toEqual([true, true, true])
	expect(await Promise.all(bottomFiles.map(async file => (await layer.addNodeIfFitting(file)).added))).toEqual([true, true, true, true])
	expect(await Promise.all(leftFiles.map(async file => (await layer.addNodeIfFitting(file)).added))).toEqual([true, true, true])

	expect(layer.getSuggestions().map(suggestion => ({...suggestion, node: suggestion.node.getId()}))).toEqual([
		{node: topFiles[0].getId(), suggestedPosition: new LocalPosition(22.5, 0+8)},
		{node: topFiles[1].getId(), suggestedPosition: new LocalPosition(37.5, 0+8)},
		{node: topFiles[2].getId(), suggestedPosition: new LocalPosition(52.5, 0+8)},
		{node: topFiles[3].getId(), suggestedPosition: new LocalPosition(67.5, 0+8)},
		{node: rightFiles[0].getId(), suggestedPosition: new LocalPosition(90-8, 30)},
		{node: rightFiles[1].getId(), suggestedPosition: new LocalPosition(90-8, 45)},
		{node: rightFiles[2].getId(), suggestedPosition: new LocalPosition(90-8, 60)},
		{node: bottomFiles[0].getId(), suggestedPosition: new LocalPosition(22.5, 90-8)},
		{node: bottomFiles[1].getId(), suggestedPosition: new LocalPosition(37.5, 90-8)},
		{node: bottomFiles[2].getId(), suggestedPosition: new LocalPosition(52.5, 90-8)},
		{node: bottomFiles[3].getId(), suggestedPosition: new LocalPosition(67.5, 90-8)},
		{node: leftFiles[0].getId(), suggestedPosition: new LocalPosition(0+8, 30)},
		{node: leftFiles[1].getId(), suggestedPosition: new LocalPosition(0+8, 45)},
		{node: leftFiles[2].getId(), suggestedPosition: new LocalPosition(0+8, 60)},
	])
})

test('two InnerLayers', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: 'folderToOrder', parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const file: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('file', 10, 45, 20, 10), parent: folderToOrder, addToParent: true, rendered: true})
	const innerFile: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('innerFile', 40, 45, 20, 10), parent: folderToOrder, addToParent: true, rendered: true})

	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(5, 50)}, to: file, save: true})
	await folderToOrder.links.add({from: file, to: innerFile, save: true})

	const layer = new InnerLayer(await BorderLayer.new(folderToOrder))
	expect((await layer.addNodeIfFitting(file)).added).toBe(true)
	expect((await layer.addNodeIfFitting(innerFile)).added).toBe(false)
	expect(layer.left.nodes.map(nodeToOrder => ({...nodeToOrder, node: nodeToOrder.node.getId()}))).toEqual([{node: 'file', wishPosition: new LocalPosition(-25, 50)}])
	expect(layer.nodes.map(nodeToOrder => ({...nodeToOrder, node: nodeToOrder.node.getId()}))).toEqual([{node: 'file', wishPosition: new LocalPosition(-25, 50)}])
	expect(layer.getSuggestions().map(suggestion => ({...suggestion, node: suggestion.node.getId()}))).toEqual([{node: 'file', suggestedPosition: new LocalPosition(8, 45)}])

	const innerLayer = new InnerLayer(layer)
	expect((await innerLayer.addNodeIfFitting(innerFile)).added).toBe(true)
	expect(innerLayer.left.nodes.map(nodeToOrder => ({...nodeToOrder, node: nodeToOrder.node.getId()}))).toEqual([{node: 'innerFile', wishPosition: new LocalPosition(20, 50)}])
	expect(innerLayer.nodes.map(nodeToOrder => ({...nodeToOrder, node: nodeToOrder.node.getId()}))).toEqual([{node: 'innerFile', wishPosition: new LocalPosition(20, 50)}])

	expect(innerLayer.getSuggestions().map(suggestion => ({...suggestion, node: suggestion.node.getId()}))).toEqual([{node: 'innerFile', suggestedPosition: new LocalPosition(8 + 20*1.5, 45)}])
})

test('no overlaps of sides', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: BoxData.buildNewWithId('folderToOrder', 10, 10, 50, 50), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const topFile: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('topFile', 20, 10, 20, 10), parent: folderToOrder, addToParent: true, rendered: true})
	const leftFile: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('leftFile', 10, 20, 20, 10), parent: folderToOrder, addToParent: true, rendered: true})

	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(10 + (20+10)/2, 0)}, to: topFile, save: true})
	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(0, 10 + (20+5)/2)}, to: leftFile, save: true})

	const layer = new InnerLayer(await BorderLayer.new(folderToOrder))
	expect((await layer.addNodeIfFitting(topFile)).added).toBe(true)
	expect((await layer.addNodeIfFitting(leftFile)).added).toBe(true)

	expect(layer.top.nodes.map(nodeToOrder => ({...nodeToOrder, node: nodeToOrder.node.getId()}))).toEqual([{node: 'topFile', wishPosition: new LocalPosition(20+10, -20)}])
	expect(layer.left.nodes.map(nodeToOrder => ({...nodeToOrder, node: nodeToOrder.node.getId()}))).toEqual([{node: 'leftFile', wishPosition: new LocalPosition(-20, 20+5)}])
	expect(layer.nodes.map(nodeToOrder => ({...nodeToOrder, node: nodeToOrder.node.getId()}))).toEqual([
		{node: 'topFile', wishPosition: new LocalPosition(20+10, -20)},
		{node: 'leftFile', wishPosition: new LocalPosition(-20, 20+5)}
	])
	expect(layer.top.getRect()).toEqual(new LocalRect(8, 8, 84, 15))
	expect(layer.left.getRect()).toEqual(new LocalRect(8, 8+15, 30, 69))

	expect(layer.getSuggestions().map(suggestion => ({...suggestion, node: suggestion.node.getId()}))).toEqual([
		{node: 'topFile', suggestedPosition: new LocalPosition(20, 8)},
		{node: 'leftFile', suggestedPosition: new LocalPosition(8, 8 + 10*1.5 + 5/2)}
	])
})

test('files are assigned to correct side', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: 'folderToOrder', parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftFile: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('leftFile', 10, 80, 20, 10), parent: folderToOrder, addToParent: true, rendered: true})
	const rightFile: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('rightFile', 70, 80, 20, 10), parent: folderToOrder, addToParent: true, rendered: true})

	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(90, 95)}, to: leftFile, save: true})
	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(90, 95)}, to: rightFile, save: true})

	const layer = new InnerLayer(await BorderLayer.new(folderToOrder))
	expect((await layer.addNodeIfFitting(leftFile)).added).toBe(true)
	expect((await layer.addNodeIfFitting(rightFile)).added).toBe(true)

	expect(layer.top.nodes.length).toBe(0)
	expect(layer.left.nodes.length).toBe(0)
	expect(layer.right.nodes.length).toBe(0)
	expect(layer.bottom.nodes.map(nodeToOrder => ({...nodeToOrder, node: nodeToOrder.node.getId(), wishPosition: nodeToOrder.wishPosition.newRounded(3)}))).toEqual([
		{node: 'leftFile', wishPosition: new LocalPosition(117, 125)},
		{node: 'rightFile', wishPosition: new LocalPosition(117, 125)}
	])
	expect(layer.bottom.getRect()).toEqual(new LocalRect(8, 77, 84, 15))

	expect(layer.getSuggestions().map(suggestion => ({...suggestion, node: suggestion.node.getId()}))).toEqual([
		{node: 'leftFile', suggestedPosition: new LocalPosition(37, 82)},
		{node: 'rightFile', suggestedPosition: new LocalPosition(67, 82)}
	])
})