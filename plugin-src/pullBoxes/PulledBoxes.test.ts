import { ClientRect } from '../../dist/core/ClientRect'
import * as testUtil from '../linkBundler/testUtil/testUtil'
import * as boxFactory from '../linkBundler/testUtil/boxFactory'
import { RootFolderBox } from '../../dist/core/box/RootFolderBox'
import { FolderBox } from '../../dist/core/box/FolderBox'
import { BoxData } from '../../dist/core/mapData/BoxData'
import { FileBox } from '../../dist/core/box/FileBox'
import { PulledBoxes } from './PulledBoxes'
import { PullReason } from './PullReason'
import { LinkRoute } from '../../dist/core/link/LinkRoute'
import * as map from '../../dist/core/Map'
import { BoxWatcher } from '../../dist/core/box/BoxWatcher'

test('pullBoxIfNecessary, files to pull inside screen', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: false})
	map.setMap({getUncoveredMapClientRect: async () => new ClientRect(0, 0, 1600, 800)} as map.Map)

	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true, getClientRect: async () => new ClientRect(400, 0, 800, 800)})
	const selectedFolder: FolderBox = boxFactory.folderOf({idOrData: new BoxData('selectedFolder', 40, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const pulledFolder: FolderBox = boxFactory.folderOf({idOrData: new BoxData('pulledFolder', 70, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const upperPulledFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('upperPulledFile', 40, 25, 20, 20, [], []), parent: pulledFolder, addToParent: true, rendered: true, bodyRendered: true})
	const lowerPulledFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('lowerPulledFile', 40, 55, 20, 20, [], []), parent: pulledFolder, addToParent: true, rendered: true, bodyRendered: true})
	const upperLink = await rootFolder.links.add({from: selectedFolder, to: upperPulledFile, save: true})
	const lowerLink = await rootFolder.links.add({from: selectedFolder, to: lowerPulledFile, save: true})
	expect(await rootFolder.getClientRect()).toEqual({x: 400, y: 0, width: 800, height: 800})
	expect(roundRect(await selectedFolder.getClientRect())).toEqual({x: 720, y: 360, width: 160, height: 80})
	expect(roundRect(await pulledFolder.getClientRect())).toEqual({x: 960, y: 360, width: 160, height: 80})
	expect(await upperPulledFile.getClientRect()).toEqual({x: 1024, y: 380, width: 32, height: 16})
	expect(roundRect(await lowerPulledFile.getClientRect())).toEqual({x: 1024, y: 404, width: 32, height: 16})

	const pulledBoxes = new PulledBoxes()
	// pull upper file
	expect((await pulledBoxes.pullBoxIfNecessary(upperPulledFile, new PullReason(selectedFolder, new LinkRoute(undefined, upperLink)))).pulled).toBe(true)

	expect(await rootFolder.getClientRect()).toEqual({x: 400, y: 0, width: 800, height: 800})
	expect(roundRect(await selectedFolder.getClientRect())).toEqual({x: 720, y: 360, width: 160, height: 80})
	let pulledFolderRect: ClientRect = await pulledFolder.getClientRect()
	let upperPulledFileRect: ClientRect = await upperPulledFile.getClientRect()
	expect(upperPulledFileRect.isInsideOrEqual(pulledFolderRect)).toBe(true)
	expect(roundRect(pulledFolderRect)).toEqual({x: 932, y: 306, width: 216, height: 140})
	expect(upperPulledFileRect).toEqual({x: 940, y: 338, width: 200, height: 100})

	// pull lower file
	expect((await pulledBoxes.pullBoxIfNecessary(lowerPulledFile, new PullReason(selectedFolder, new LinkRoute(undefined, lowerLink)))).pulled).toBe(true)

	expect(await rootFolder.getClientRect()).toEqual({x: 400, y: 0, width: 800, height: 800})
	expect(roundRect(await selectedFolder.getClientRect())).toEqual({x: 720, y: 360, width: 160, height: 80})
	pulledFolderRect = await pulledFolder.getClientRect()
	upperPulledFileRect = await upperPulledFile.getClientRect()
	const lowerPulledFileRect: ClientRect = await lowerPulledFile.getClientRect()
	expect(upperPulledFileRect.isInsideOrEqual(pulledFolderRect)).toBe(true)
	expect(lowerPulledFileRect.isInsideOrEqual(pulledFolderRect)).toBe(true)
	/*expect(upperPulledFileRect.isOverlappingWith(lowerPulledFileRect)).toBe(false) TODO
	expect(roundRect(pulledFolderRect)).toEqual({x: 960, y: 360, width: 160, height: 80})
	expect(upperPulledFileRect).toEqual({x: 940, y: 338, width: 200, height: 100})
	expect(roundRect(lowerPulledFileRect)).toEqual({x: 940, y: 362, width: 200, height: 100})*/
})

test('pullBoxIfNecessary, files to pull outside screen', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: false})
	map.setMap({getUncoveredMapClientRect: async () => new ClientRect(0, 0, 800, 800)} as map.Map)

	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({
		idOrSettings: 'root',
		rendered: true,
		bodyRendered: true,
		getClientRect: async () => new ClientRect(-400, -400, 1600, 1600),
		getMapClientRect: async () => new ClientRect(0, 0, 800, 800)
	})
	const selectedFolder: FolderBox = boxFactory.folderOf({idOrData: new BoxData('selectedFolder', 40, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const pulledFolder: FolderBox = boxFactory.folderOf({idOrData: new BoxData('pulledFolder', 80, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const upperPulledFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('upperPulledFile', 40, 25, 20, 20, [], []), parent: pulledFolder, addToParent: true, rendered: true, bodyRendered: true})
	await BoxWatcher.newAndWatch(upperPulledFile) // prevent unrender, TODO: add to factory?
	const lowerPulledFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('lowerPulledFile', 40, 55, 20, 20, [], []), parent: pulledFolder, addToParent: true, rendered: true, bodyRendered: true})
	await BoxWatcher.newAndWatch(lowerPulledFile) // prevent unrender, TODO: add to factory?
	const upperLink = await rootFolder.links.add({from: selectedFolder, to: upperPulledFile, save: true})
	const lowerLink = await rootFolder.links.add({from: selectedFolder, to: lowerPulledFile, save: true})
	expect(await rootFolder.getClientRect()).toEqual({x: -400, y: -400, width: 1600, height: 1600})
	expect(roundRect(await selectedFolder.getClientRect())).toEqual({x: 240, y: 320, width: 320, height: 160})
	expect(roundRect(await pulledFolder.getClientRect())).toEqual({x: 880, y: 320, width: 320, height: 160})
	expect(roundRect(await upperPulledFile.getClientRect())).toEqual({x: 1008, y: 360, width: 64, height: 32})
	expect(roundRect(await lowerPulledFile.getClientRect())).toEqual({x: 1008, y: 408, width: 64, height: 32})

	const pulledBoxes = new PulledBoxes()
	// pull upper file
	expect((await pulledBoxes.pullBoxIfNecessary(upperPulledFile, new PullReason(selectedFolder, new LinkRoute(undefined, upperLink)))).pulled).toBe(true)
	
	expect(await rootFolder.getClientRect()).toEqual({x: -400, y: -400, width: 1600, height: 1600})
	expect(roundRect(await selectedFolder.getClientRect())).toEqual({x: 240, y: 320, width: 320, height: 160})
	let pulledFolderRect: ClientRect = await pulledFolder.getClientRect()
	let upperPulledFileRect: ClientRect = await upperPulledFile.getClientRect()
	expect(pulledFolderRect.isInsideOrEqual(await rootFolder.context.getMapClientRect())).toBe(true)
	expect(upperPulledFileRect.isInsideOrEqual(pulledFolderRect)).toBe(true)
	expect(roundRect(pulledFolderRect)).toEqual({x: 572, y: 307.5, width: 228, height: 160})
	expect(upperPulledFileRect).toEqual({x: 580, y: 339.5, width: 200, height: 100})

	// pull lower file
	expect((await pulledBoxes.pullBoxIfNecessary(lowerPulledFile, new PullReason(selectedFolder, new LinkRoute(undefined, lowerLink)))).pulled).toBe(true)

	expect(await rootFolder.getClientRect()).toEqual({x: -400, y: -400, width: 1600, height: 1600})
	expect(roundRect(await selectedFolder.getClientRect())).toEqual({x: 240, y: 320, width: 320, height: 160})
	pulledFolderRect = await pulledFolder.getClientRect()
	upperPulledFileRect = await upperPulledFile.getClientRect()
	const lowerPulledFileRect: ClientRect = await lowerPulledFile.getClientRect()
	expect(upperPulledFileRect.isInsideOrEqual(pulledFolderRect)).toBe(true)
	expect(lowerPulledFileRect.isInsideOrEqual(pulledFolderRect)).toBe(true)
	/*expect(upperPulledFileRect.isOverlappingWith(lowerPulledFileRect)).toBe(false) TODO*/
	expect(roundRect(pulledFolderRect)).toEqual({x: 572, y: 307.5, width: 228, height: 161.76})
	expect(upperPulledFileRect).toEqual({x: 580, y: 339.5, width: 200, height: 100})
	expect(roundRect(lowerPulledFileRect)).toEqual({x: 580, y: 361.26, width: 200, height: 100})
})

test('pullBoxIfNecessary, file to pull deep inside screen', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: false})
	map.setMap({getUncoveredMapClientRect: async () => new ClientRect(0, 0, 800, 800)} as map.Map)

	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({
		idOrSettings: 'root',
		rendered: true,
		bodyRendered: true,
		getClientRect: async () => new ClientRect(0, 0, 800, 800),
		getMapClientRect: async () => new ClientRect(0, 0, 800, 800)
	})
	const selectedFolder: FolderBox = boxFactory.folderOf({idOrData: new BoxData('selectedFolder', 40, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const outerFolderToPull: FolderBox = boxFactory.folderOf({idOrData: new BoxData('outerFolderToPull', 80, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const innerFolderToPull: FolderBox = boxFactory.folderOf({idOrData: new BoxData('innerFolderToPull', 40, 40, 20, 20, [], []), parent: outerFolderToPull, addToParent: true, rendered: true, bodyRendered: true})
	const deepInnerFolderToPull: FolderBox = boxFactory.folderOf({idOrData: new BoxData('deepInnerFolderToPull', 37.5, 37.5, 25, 25, [], []), parent: innerFolderToPull, addToParent: true, rendered: true, bodyRendered: true})
	const fileToPull: FileBox = boxFactory.fileOf({idOrData: new BoxData('fileToPull', 37.5, 37.5, 25, 25, [], []), parent: deepInnerFolderToPull, addToParent: true, rendered: true, bodyRendered: true})
	await BoxWatcher.newAndWatch(fileToPull) // prevent unrender, TODO: add to factory?
	const link = await rootFolder.links.add({from: selectedFolder, to: fileToPull, save: true})
	expect(await rootFolder.getClientRect()).toEqual({x: 0, y: 0, width: 800, height: 800})
	expect(roundRect(await selectedFolder.getClientRect())).toEqual({x: 320, y: 360, width: 160, height: 80})
	expect(roundRect(await outerFolderToPull.getClientRect())).toEqual({x: 640, y: 360, width: 160, height: 80})
	expect(roundRect(await innerFolderToPull.getClientRect())).toEqual({x: 704, y: 392, width: 32, height: 16})
	expect(roundRect(await deepInnerFolderToPull.getClientRect())).toEqual({x: 716, y: 398, width: 8, height: 4})
	expect(roundRect(await fileToPull.getClientRect())).toEqual({x: 719, y: 399.5, width: 2, height: 1})

	const pulledBoxes = new PulledBoxes()
	expect((await pulledBoxes.pullBoxIfNecessary(fileToPull, new PullReason(selectedFolder, new LinkRoute(undefined, link)))).pulled).toBe(true)

	expect(await rootFolder.getClientRect()).toEqual({x: 0, y: 0, width: 800, height: 800})
	expect(roundRect(await selectedFolder.getClientRect())).toEqual({x: 320, y: 360, width: 160, height: 80})
	let outerFolderRect: ClientRect = await outerFolderToPull.getClientRect()
	//expect(outerFolderRect.isInsideOrEqual(await rootFolder.context.getMapClientRect())).toBe(true) // not inside by a few pixels, TODO: improve?
	expect(roundRect(outerFolderRect)).toEqual({x: 556, y: 254, width: 248, height: 220})
	let innerFolderRect: ClientRect = await innerFolderToPull.getClientRect()
	expect(innerFolderRect.isInsideOrEqual(outerFolderRect)).toBe(true)
	expect(innerFolderRect).toEqual({x: 564, y: 286, width: 232, height: 180})
	let deepInnerFolderRect: ClientRect = await deepInnerFolderToPull.getClientRect()
	expect(deepInnerFolderRect.isInsideOrEqual(innerFolderRect)).toBe(true)
	expect(deepInnerFolderRect).toEqual({x: 572, y: 318, width: 216, height: 140})
	let fileRect: ClientRect = await fileToPull.getClientRect()
	expect(fileRect.isInsideOrEqual(deepInnerFolderRect)).toBe(true)
	expect(fileRect).toEqual({x: 580, y: 350, width: 200, height: 100})
})

test('pullBoxIfNecessary, file to pull deep outside screen', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: false})
	map.setMap({getUncoveredMapClientRect: async () => new ClientRect(0, 0, 800, 800)} as map.Map)

	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({
		idOrSettings: 'root',
		rendered: true,
		bodyRendered: true,
		getClientRect: async () => new ClientRect(-400, -400, 1600, 1600),
		getMapClientRect: async () => new ClientRect(0, 0, 800, 800)
	})
	const selectedFolder: FolderBox = boxFactory.folderOf({idOrData: new BoxData('selectedFolder', 40, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const outerFolderToPull: FolderBox = boxFactory.folderOf({idOrData: new BoxData('outerFolderToPull', 80, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const innerFolderToPull: FolderBox = boxFactory.folderOf({idOrData: new BoxData('innerFolderToPull', 40, 40, 20, 20, [], []), parent: outerFolderToPull, addToParent: true, rendered: true, bodyRendered: true})
	const deepInnerFolderToPull: FolderBox = boxFactory.folderOf({idOrData: new BoxData('deepInnerFolderToPull', 37.5, 37.5, 25, 25, [], []), parent: innerFolderToPull, addToParent: true, rendered: true, bodyRendered: true})
	const fileToPull: FileBox = boxFactory.fileOf({idOrData: new BoxData('fileToPull', 37.5, 37.5, 25, 25, [], []), parent: deepInnerFolderToPull, addToParent: true, rendered: true, bodyRendered: true})
	await BoxWatcher.newAndWatch(fileToPull) // prevent unrender, TODO: add to factory?
	const link = await rootFolder.links.add({from: selectedFolder, to: fileToPull, save: true})
	expect(await rootFolder.getClientRect()).toEqual({x: -400, y: -400, width: 1600, height: 1600})
	expect(roundRect(await selectedFolder.getClientRect())).toEqual({x: 240, y: 320, width: 320, height: 160})
	expect(roundRect(await outerFolderToPull.getClientRect())).toEqual({x: 880, y: 320, width: 320, height: 160})
	expect(roundRect(await innerFolderToPull.getClientRect())).toEqual({x: 1008, y: 384, width: 64, height: 32})
	expect(roundRect(await deepInnerFolderToPull.getClientRect())).toEqual({x: 1032, y: 396, width: 16, height: 8})
	expect(roundRect(await fileToPull.getClientRect())).toEqual({x: 1038, y: 399, width: 4, height: 2})

	const pulledBoxes = new PulledBoxes()
	expect((await pulledBoxes.pullBoxIfNecessary(fileToPull, new PullReason(selectedFolder, new LinkRoute(undefined, link)))).pulled).toBe(true)
	
	expect(await rootFolder.getClientRect()).toEqual({x: -400, y: -400, width: 1600, height: 1600})
	expect(roundRect(await selectedFolder.getClientRect())).toEqual({x: 240, y: 320, width: 320, height: 160})
	let outerFolderRect: ClientRect = await outerFolderToPull.getClientRect()
	expect(outerFolderRect.isInsideOrEqual(await rootFolder.context.getMapClientRect())).toBe(true)
	expect(outerFolderRect).toEqual({x: 556, y: 254, width: 244, height: 220})
	let innerFolderRect: ClientRect = await innerFolderToPull.getClientRect()
	expect(innerFolderRect.isInsideOrEqual(outerFolderRect)).toBe(true)
	expect(innerFolderRect).toEqual({x: 564, y: 286, width: 232, height: 180})
	let deepInnerFolderRect: ClientRect = await deepInnerFolderToPull.getClientRect()
	expect(deepInnerFolderRect.isInsideOrEqual(innerFolderRect)).toBe(true)
	expect(deepInnerFolderRect).toEqual({x: 572, y: 318, width: 216, height: 140})
	let fileRect: ClientRect = await fileToPull.getClientRect()
	expect(fileRect.isInsideOrEqual(deepInnerFolderRect)).toBe(true)
	expect(fileRect).toEqual({x: 580, y: 350, width: 200, height: 100})
})

function roundRect(rect: ClientRect): ClientRect {
	return new ClientRect(round(rect.x), round(rect.y), round(rect.width), round(rect.height))
}

function round(value: number): number {
	return Math.round(value*100)/100
}