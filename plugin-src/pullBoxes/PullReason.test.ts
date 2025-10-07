import * as testUtil from '../../test/testUtil'
import * as map from '../../src/core/Map'
import * as boxFactory from '../../test/core/box/factories/boxFactory'
import { RootFolderBox } from '../../src/core/box/RootFolderBox'
import { FileBox } from '../../src/core/box/FileBox'
import { BoxData } from '../../src/core/mapData/BoxData'
import { ClientRect } from '../../src/core/ClientRect'
import { Link } from '../../src/core/link/Link'
import { PullReason } from './PullReason'
import { LinkRoute } from '../../src/core/link/LinkRoute'
import { ClientPosition } from '../../src/core/shape/ClientPosition'

test('calculatePullPositionFor box inside screen', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: false})
	map.setMap({getUncoveredMapClientRect: async () => new ClientRect(0, 0, 800, 800)} as map.Map)

	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({
		idOrSettings: 'root',
		rendered: true,
		bodyRendered: true,
		getClientRect: async () => new ClientRect(0, 0, 800, 800),
		getMapClientRect: async () => new ClientRect(0, 0, 800, 800)
	})
	const selectedFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('selectedFile', 20, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const fileToPull: FileBox = boxFactory.fileOf({idOrData: new BoxData('fileToPull', 60, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const link: Link = await rootFolder.links.add({from: selectedFile, to: fileToPull, save: true})
	const pullReason = new PullReason(selectedFile, new LinkRoute(undefined, link))
	
	expect(await rootFolder.getClientRect()).toEqual({x: 0, y: 0, width: 800, height: 800})
	expect(roundRect(await selectedFile.getClientRect())).toEqual({x: 160, y: 360, width: 160, height: 80})
	expect(roundRect(await fileToPull.getClientRect())).toEqual({x: 480, y: 360, width: 160, height: 80})
	
	expect(await pullReason.calculatePullPositionFor(fileToPull)).toEqual({position: new ClientPosition(560, 400), direction: {x: 1, y: 0}})
})

test('calculatePullPositionFor box outside screen', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: false})
	map.setMap({getUncoveredMapClientRect: async () => new ClientRect(0, 0, 800, 800)} as map.Map)

	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({
		idOrSettings: 'root',
		rendered: true,
		bodyRendered: true,
		getClientRect: async () => new ClientRect(-400, -400, 1600, 1600),
		getMapClientRect: async () => new ClientRect(0, 0, 800, 800)
	})
	const selectedFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('selectedFile', 40, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const fileToPull: FileBox = boxFactory.fileOf({idOrData: new BoxData('fileToPull', 95, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const link: Link = await rootFolder.links.add({from: selectedFile, to: fileToPull, save: true})
	const pullReason = new PullReason(selectedFile, new LinkRoute(undefined, link))
	
	expect(await rootFolder.getClientRect()).toEqual({x: -400, y: -400, width: 1600, height: 1600})
	expect(roundRect(await selectedFile.getClientRect())).toEqual({x: 240, y: 320, width: 320, height: 160})
	expect(roundRect(await fileToPull.getClientRect())).toEqual({x: 1120, y: 320, width: 320, height: 160})
	
	expect(await pullReason.calculatePullPositionFor(fileToPull)).toEqual({position: new ClientPosition(680, 400), direction: {x: 1, y: 0}})
})

test('calculatePullPositionFor linkRoute starts outside screen', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: false})
	map.setMap({getUncoveredMapClientRect: async () => new ClientRect(0, 0, 800, 800)} as map.Map)

	const rootFolder: RootFolderBox = boxFactory.rootFolderOf({
		idOrSettings: 'root',
		rendered: true,
		bodyRendered: true,
		getClientRect: async () => new ClientRect(0, -400, 1600, 1600),
		getMapClientRect: async () => new ClientRect(0, 0, 800, 800)
	})
	const selectedFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('selectedFile', 40, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const fileToPull: FileBox = boxFactory.fileOf({idOrData: new BoxData('fileToPull', 70, 45, 20, 10, [], []), parent: rootFolder, addToParent: true, rendered: true, bodyRendered: true})
	const link: Link = await rootFolder.links.add({from: selectedFile, to: fileToPull, save: true})
	const pullReason = new PullReason(selectedFile, new LinkRoute(undefined, link))
	
	expect(await rootFolder.getClientRect()).toEqual({x: 0, y: -400, width: 1600, height: 1600})
	expect(roundRect(await selectedFile.getClientRect())).toEqual({x: 640, y: 320, width: 320, height: 160})
	expect(roundRect(await fileToPull.getClientRect())).toEqual({x: 1120, y: 320, width: 320, height: 160})
	
	expect(await pullReason.calculatePullPositionFor(fileToPull)).toEqual({position: new ClientPosition(680, 400), direction: {x: 1, y: 0}})
})

function roundRect(rect: ClientRect): ClientRect {
	return new ClientRect(round(rect.x), round(rect.y), round(rect.width), round(rect.height))
}

function round(value: number): number {
	return Math.round(value*100)/100
}