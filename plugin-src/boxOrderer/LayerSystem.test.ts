import { FileBox } from '../../dist/core/box/FileBox'
import { FolderBox } from '../../dist/core/box/FolderBox'
import { RootFolderBox } from '../../dist/core/box/RootFolderBox'
import { LocalRect } from '../../dist/core/LocalRect'
import { BoxData } from '../../dist/core/mapData/BoxData'
import { LocalPosition } from '../../dist/core/shape/LocalPosition'
import * as boxFactory from '../linkBundler/testUtil/boxFactory'
import * as testUtil from '../linkBundler/testUtil/testUtil'
import {LayerSystem} from './LayerSystem'

test('too thick layers are scaled', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: 'folderToOrder', parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftFile: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('leftFile', 10, 20, 50, 20), parent: folderToOrder, addToParent: true})
	const rightFile: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('rightFile', 40, 60, 50, 20), parent: folderToOrder, addToParent: true})
	
	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(0, 50)}, to: leftFile, save: true})
	await rootFolder.links.add({from: rightFile, to: {node: rootFolder, positionInToNodeCoords: new LocalPosition(100, 50)}, save: true})
	
	const layerSystem: LayerSystem = await LayerSystem.newAndAssignNodesToLayers(folderToOrder)
	const wishedWidthForBoxes: number = (50+50)*1.5
	const availableWidthForBoxes: number = 100-8-8
	const expectedScalingFactor: number = availableWidthForBoxes / wishedWidthForBoxes
	const expectedWidth: number = 50*expectedScalingFactor
	const expectedHeight: number = 20*expectedScalingFactor
	expect(leftFile.getMapData().getRect()).toEqual(new LocalRect(8, 50 - expectedHeight/2, expectedWidth, 20*expectedScalingFactor))
	expect(rightFile.getMapData().getRect()).toEqual(new LocalRect(100-8 - expectedWidth, 50 - expectedHeight/2, expectedWidth, 20*expectedScalingFactor))
})

test('scale two InnerLayers', async () => {
	testUtil.initServicesWithMocks({hideConsoleLog: false})
	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'rootFolder', rendered: true, bodyRendered: true})
	const folderToOrder: FolderBox = boxFactory.folderOf({idOrData: 'folderToOrder', parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftFile: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('leftFile', 10, 20, 50, 20), parent: folderToOrder, addToParent: true, rendered: true})
	const leftInnerFile: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('leftInnerFile', 25, 40, 50, 20), parent: folderToOrder, addToParent: true, rendered: true})
	const rightFile: FileBox = boxFactory.fileOf({idOrData: BoxData.buildNewWithId('rightFile', 40, 60, 50, 20), parent: folderToOrder, addToParent: true, rendered: true})
	
	await rootFolder.links.add({from: {node: rootFolder, positionInFromNodeCoords: new LocalPosition(0, 50)}, to: leftFile, save: true})
	await folderToOrder.links.add({from: leftFile, to: leftInnerFile, save: true})
	await rootFolder.links.add({from: rightFile, to: {node: rootFolder, positionInToNodeCoords: new LocalPosition(100, 50)}, save: true})
	
	const layerSystem: LayerSystem = await LayerSystem.newAndAssignNodesToLayers(folderToOrder)

	const wishedWidthForBoxes: number = (50+50+50)*1.5
	const availableWidthForBoxes: number = 100-8-8
	const expectedScalingFactor: number = availableWidthForBoxes / wishedWidthForBoxes
	const expectedWidth: number = 50*expectedScalingFactor
	const expectedHeight: number = 20*expectedScalingFactor
	const expectedY: number = 50 - expectedHeight/2

	expect(layerSystem.layers.length).toBe(3)
	expect(layerSystem.layers[0].left.calculateThickness()).toEqual(8)
	expect(layerSystem.layers[0].right.calculateThickness()).toEqual(8)
	expect(round(layerSystem.layers[1].left.calculateThickness())).toEqual(round(expectedWidth*1.5))
	expect(round(layerSystem.layers[1].right.calculateThickness())).toEqual(round(expectedWidth*1.5))
	expect(round(layerSystem.layers[2].left.calculateThickness())).toEqual(round(expectedWidth*1.5))
	expect(layerSystem.layers[2].right.calculateThickness()).toEqual(0)

	expect(roundRect(leftFile.getMapData().getRect())).toEqual(roundRect(new LocalRect(8, expectedY, expectedWidth, 20*expectedScalingFactor)))
	expect(roundRect(leftInnerFile.getMapData().getRect())).toEqual(roundRect(new LocalRect(8 + expectedWidth*1.5, expectedY, expectedWidth, 20*expectedScalingFactor)))
	expect(roundRect(rightFile.getMapData().getRect())).toEqual(roundRect(new LocalRect(100-8 - expectedWidth, expectedY, expectedWidth, 20*expectedScalingFactor)))
})

function roundRect(rect: LocalRect): LocalRect {
	return new LocalRect(round(rect.x), round(rect.y), round(rect.width), round(rect.height))
}

function round(value: number): number {
	return Math.round(value*100)/100
}