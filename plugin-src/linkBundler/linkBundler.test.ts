//import * as testUtil from '../../test/testUtil' // would result in other modules as they would be loaded from 'src' and not from 'dist'
import * as testUtil from './testUtil/testUtil'
//import * as boxFactory from '../../test/core/box/factories/boxFactory' // would result in other modules as they would be loaded from 'src' and not from 'dist'
import * as boxFactory from './testUtil/boxFactory'
import * as linkBundler from '../linkBundler'
import * as settings from '../../dist/core/settings/settings'
import * as fileSystem from '../../dist/core/fileSystemAdapter'
import { Matcher, MockProxy, mock } from 'jest-mock-extended'
import { BoxManager } from '../../dist/core/box/BoxManager'
import { FileSystemAdapter } from '../../dist/core/fileSystemAdapter'
import * as coreUtil from '../../dist/core/util/util'
import { RenderManager } from '../../dist/core/RenderManager'
import { BoxLinks } from '../../dist/core/box/BoxLinks'
import { Link } from '../../dist/core/link/Link'

test('bundleLink, nothing to bundle', async () => {
	await initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const fileA = boxFactory.fileOf({idOrData: 'fileA', parent: root, addToParent: true, rendered: true})
	const fileB = boxFactory.fileOf({idOrData: 'fileB', parent: root, addToParent: true, rendered: true})
	const link = await root.links.add({from: fileA, to: fileB, save: true})
	
	await linkBundler.bundleLink(link)

	expect(link.getData().from.path.map(waypoint => waypoint.boxId)).toEqual(['fileA'])
	expect(link.getData().to.path.map(waypoint => waypoint.boxId)).toEqual(['fileB'])
})

test('bundleLink, insert one node', async () => {
	await initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const rightFile = boxFactory.fileOf({idOrData: 'rootFolderFile', parent: root, addToParent: true, rendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: 'leftFolder', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	
	const topLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFile, save: true})
	const bottomLink: Link = await root.links.add({from: leftFolderBottomFile, to: rightFile, save: true})
	const consoleWarn: jest.SpyInstance = jest.spyOn(console, 'warn').mockImplementation()
	
	await linkBundler.bundleLink(topLink)
	//await linkBundler.findAndExtendCommonRoutes(link as any, 'from', [])

	const topLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderTopFile, rightFile)!
	expect(topLinkRoute.length).toBe(2)
	expect(topLinkRoute[0].getId()).toBe(topLink.getId())
	expect(topLinkRoute[1].getId()).toBe(bottomLink.getId())

	const bottomLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFile)!
	expect(bottomLinkRoute.length).toBe(2)
	expect(bottomLinkRoute[1].getId()).toBe(bottomLink.getId())
	
	expect(topLink.getData().from.path.map(waypoint => waypoint.boxId)).toEqual(['leftFolderTopFile'])
	expect(topLink.getData().to.path.map(waypoint => waypoint.boxId)).toEqual([expect.stringContaining('node')])
	//expect(topLink.getData().to.path.map(waypoint => waypoint.boxId)).toEqual(expect.arrayContaining(['rightFile', expect.anything()]))

	expect(console.warn).toBeCalledWith('linkBundler.bundleLinkEndIntoCommonRoutePart(..) expected exactly one intersection but are 0')
	expect(console.warn).toBeCalledTimes(1)
	consoleWarn.mockRestore()
})

test('bundleLink, insert two nodes', async () => {
	await initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: 'leftFolder', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: 'rightFolder', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})
	
	const topLink = await root.links.add({from: leftFolderTopFile, to: rightFolderTopFile, save: true})
	const bottomLink = await root.links.add({from: leftFolderBottomFile, to: rightFolderBottomFile, save: true})
	const consoleWarn: jest.SpyInstance = jest.spyOn(console, 'warn').mockImplementation()

	await linkBundler.bundleLink(topLink)
	
	const topLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)!
	expect(topLinkRoute.length).toBe(3)
	expect(topLinkRoute[0].getId()).toBe(topLink.getId())
	expect(topLinkRoute[1].getId()).toBe(bottomLink.getId())

	const bottomLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)!
	expect(bottomLinkRoute.length).toBe(3)
	expect(bottomLinkRoute[1].getId()).toBe(bottomLink.getId())
	
	expect(console.warn).toBeCalledWith('linkBundler.bundleLinkEndIntoCommonRoutePart(..) expected exactly one intersection but are 0')
	expect(console.warn).toBeCalledTimes(2)
	consoleWarn.mockRestore()
})

async function initServicesWithMocks(): Promise<{
	renderManager: MockProxy<RenderManager>
	boxManager: MockProxy<BoxManager>
	fileSystem: MockProxy<FileSystemAdapter>
}> {
	const generalMocks = testUtil.initGeneralServicesWithMocks()
	generalMocks.renderManager.getClientSize.mockReturnValue({width: 1600, height: 800})

	const fileSystemMock: MockProxy<FileSystemAdapter> = mock<FileSystemAdapter>()
	fileSystem.init(fileSystemMock)
	
	fileSystemMock.doesDirentExistAndIsFile.calledWith('./settings.json').mockReturnValue(Promise.resolve(true))
	fileSystemMock.readFile.calledWith('./settings.json').mockReturnValue(Promise.resolve('{"zoomSpeed": 3,"boxMinSizeToRender": 200,"sidebar": true}'))
	await settings.init()

	return {
		...generalMocks,
		fileSystem: fileSystemMock
	}
}