import { ClientRect } from '../../dist/core/ClientRect'
import * as testUtil from '../linkBundler/testUtil/testUtil'
import * as boxFactory from '../linkBundler/testUtil/boxFactory'
import { RootFolderBox } from '../../dist/core/box/RootFolderBox'
import { FolderBox } from '../../dist/core/box/FolderBox'
import { BoxData } from '../../dist/core/mapData/BoxData'
import { FileBox } from '../../dist/pluginFacade'
import { PulledBoxes } from './PulledBoxes'
import { PullReason } from './PullReason'
import { LinkRoute } from '../../dist/core/link/LinkRoute'
import * as map from '../../dist/core/Map'

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
	expect(roundRect(pulledFolderRect)).toEqual({x: 932, y: 306, width: 216, height: 140})
	expect(upperPulledFileRect).toEqual({x: 940, y: 338, width: 200, height: 100})
	expect(upperPulledFileRect.isInsideOrEqual(pulledFolderRect)).toBe(true)

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

function roundRect(rect: ClientRect): ClientRect {
	return new ClientRect(round(rect.x), round(rect.y), round(rect.width), round(rect.height))
}

function round(value: number): number {
	return Math.round(value*100)/100
}