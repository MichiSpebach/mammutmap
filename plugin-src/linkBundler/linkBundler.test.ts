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
import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'

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

test('bundleLink, insert two nodes, both inserts in from part, bundling longLink', async () => {
	await testBundleLinkBothInsertsInFromPart('longLink')
})

test('bundleLink, insert two nodes, both inserts in from part, bundling shortLink', async () => {
	await testBundleLinkBothInsertsInFromPart('shortLink')
})

async function testBundleLinkBothInsertsInFromPart(linkToBundle: 'longLink'|'shortLink'): Promise<void> {
	await initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: 'leftFolder', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftInnerFolder = boxFactory.folderOf({idOrData: 'leftInnerFolder', parent: leftFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftFile = boxFactory.fileOf({idOrData: 'leftFile', parent: leftInnerFolder, addToParent: true, rendered: true})
	const rightFile = boxFactory.fileOf({idOrData: 'rightFile', parent: root, addToParent: true, rendered: true})

	const longLink: Link = await root.links.add({from: leftFile, to: rightFile, save: true})
	const shortLink: Link = await root.links.add({from: leftInnerFolder, to: root, save: true})
	const consoleWarn: jest.SpyInstance = jest.spyOn(console, 'warn').mockImplementation()

	await linkBundler.bundleLink({longLink, shortLink}[linkToBundle])
	
	const longRoute: Link[] = BoxLinks.findLinkRoute(leftFile, rightFile)!
	expect(longRoute.length).toBe(3)
	expect(longRoute[2].getId()).toBe(longLink.getId())

	const shortRoute: Link[] = BoxLinks.findLinkRoute(leftInnerFolder, root)!
	expect(shortRoute.length).toBe(3)
	expect(shortRoute[2].getId()).toBe(shortLink.getId())

	expect(longRoute[1].getId()).toBe(shortRoute[1].getId())
	expect(console.warn).toBeCalledWith('linkBundler.bundleLinkEndIntoCommonRoutePart(..) expected exactly one intersection but are 0')
	expect(console.warn).toBeCalledTimes(2)
	consoleWarn.mockRestore()
}

test('bundleLink, insert two nodes, both inserts in to part, bundling longLink', async () => {
	await testBundleLinkBothInsertsInToPart('longLink')
})

test('bundleLink, insert two nodes, both inserts in to part, bundling shortLink', async () => {
	await testBundleLinkBothInsertsInToPart('shortLink')
})

async function testBundleLinkBothInsertsInToPart(linkToBundle: 'longLink'|'shortLink'): Promise<void> {
	await initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: 'leftFolder', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftInnerFolder = boxFactory.folderOf({idOrData: 'leftInnerFolder', parent: leftFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftFile = boxFactory.fileOf({idOrData: 'leftFile', parent: leftInnerFolder, addToParent: true, rendered: true})
	const rightFile = boxFactory.fileOf({idOrData: 'rightFile', parent: root, addToParent: true, rendered: true})

	const longLink: Link = await root.links.add({from: rightFile, to: leftFile, save: true})
	const shortLink: Link = await root.links.add({from: root, to: leftInnerFolder, save: true})
	let shortRouteTest: Link[] = BoxLinks.findLinkRoute(root, leftInnerFolder)!
	expect(shortRouteTest.length).toBe(1) // two because start link is not in there because following link also starts from leftInnerFolder
	const consoleWarn: jest.SpyInstance = jest.spyOn(console, 'warn').mockImplementation()

	await linkBundler.bundleLink({longLink, shortLink}[linkToBundle])
	
	const longRoute: Link[] = BoxLinks.findLinkRoute(rightFile, leftFile)!
	expect(longRoute.length).toBe(3)
	expect(longRoute[0].getId()).toBe(longLink.getId())

	const shortRoute: Link[] = BoxLinks.findLinkRoute(root, leftInnerFolder)!
	expect(shortRoute.length).toBe(3)
	expect(shortRoute[0].getId()).toBe(shortLink.getId())

	expect(longRoute[1].getId()).toBe(shortRoute[1].getId())
	expect(console.warn).toBeCalledWith('linkBundler.bundleLinkEndIntoCommonRoutePart(..) expected exactly one intersection but are 0')
	expect(console.warn).toBeCalledTimes(2)
	consoleWarn.mockRestore()
}

test('findAndExtendCommonRoutes', async () => {
	await initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: 'leftFolder', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightTopFile = boxFactory.fileOf({idOrData: 'rightTopFile', parent: root, addToParent: true, rendered: true})
	const rightBottomFile = boxFactory.fileOf({idOrData: 'rightBottomFile', parent: root, addToParent: true, rendered: true})

	const topLink: Link = await root.links.add({from: leftFolderTopFile, to: rightTopFile, save: true})
	const unaffectedBottomLink: Link = await root.links.add({from: leftFolder, to: rightBottomFile, save: true})
	const bottomLeftToTopRightLink: Link = await root.links.add({from: leftFolder, to: rightTopFile, save: true})

	const commonRoutes: {
		from: {node: AbstractNodeWidget, link: Link}
		to: {node: AbstractNodeWidget, link: Link}
		length: number
	}[] = []
	await linkBundler.findAndExtendCommonRoutes(topLink, 'from', commonRoutes)
	await linkBundler.findAndExtendCommonRoutes(topLink, 'to', commonRoutes)
	const longestCommonRoute = linkBundler.getLongestCommonRoute(commonRoutes)

	expect(longestCommonRoute).toEqual({
		from: {node: leftFolder, link: bottomLeftToTopRightLink},
		to: {node: rightTopFile, link: bottomLeftToTopRightLink},
		length: 1
	})
})

test('findAndExtendCommonRoutes, different managingBoxes of links', async () => {
	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: 'leftFolder', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepFolder = boxFactory.folderOf({idOrData: 'leftDeepFolder', parent: leftFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepDeepFolder = boxFactory.folderOf({idOrData: 'leftDeepDeepFolder', parent: leftDeepFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepDeepFile = boxFactory.fileOf({idOrData: 'leftDeepDeepFile', parent: leftDeepDeepFolder, addToParent: true, rendered: true})
	const leftFileUnrenderSpy = jest.spyOn(leftDeepDeepFile, 'unrenderIfPossible').mockReturnValue(Promise.resolve({rendered: true})) // leads otherwise to undefined error
	const rightFile = boxFactory.fileOf({idOrData: 'rightFile', parent: root, addToParent: true, rendered: true})
	rightFile.body.render = () => Promise.resolve() // leads otherwise to undefined error

	const longLinkToRight: Link = await root.links.add({from: leftDeepDeepFile, to: rightFile, save: true})
	const shortLinkToRight: Link = await leftFolder.links.add({from: leftDeepDeepFolder, to: leftFolder, save: true})
	const longLinkToLeft: Link = await root.links.add({from: rightFile, to: leftDeepDeepFile, save: true})
	const shortLinkToLeft: Link = await leftFolder.links.add({from: leftFolder, to: leftDeepDeepFolder, save: true})

	expect(extractIds(await findLongestCommonRoute(longLinkToRight))).toEqual(extractIds({
		from: {node: leftDeepDeepFolder, link: shortLinkToRight},
		to: {node: leftDeepFolder, link: shortLinkToRight},
		length: 1
	}))
	expect(extractIds(await findLongestCommonRoute(shortLinkToRight))).toEqual(extractIds({
		from: {node: leftDeepDeepFolder, link: longLinkToRight},
		to: {node: leftDeepFolder, link: longLinkToRight},
		length: 1
	}))
	expect(extractIds(await findLongestCommonRoute(longLinkToLeft))).toEqual(extractIds({
		from: {node: leftDeepFolder, link: shortLinkToLeft},
		to: {node: leftDeepDeepFolder, link: shortLinkToLeft},
		length: 1
	}))
	expect(extractIds(await findLongestCommonRoute(shortLinkToLeft))).toEqual(extractIds({
		from: {node: leftDeepFolder, link: longLinkToLeft},
		to: {node: leftDeepDeepFolder, link: longLinkToLeft},
		length: 1
	}))
	expect(leftFileUnrenderSpy).toBeCalledTimes(4)
})

function extractIds(commonRoute: {
	from: {node: AbstractNodeWidget, link: Link}
	to: {node: AbstractNodeWidget, link: Link}
	length: number
} | undefined): {
	from: {nodeId: string, linkId: string}
	to: {nodeId: string, linkId: string}
	length: number
} | undefined {
	if (!commonRoute) {
		return undefined
	}
	return {
		from: {nodeId: commonRoute.from.node.getId(), linkId: commonRoute.from.link.getId()},
		to: {nodeId: commonRoute.to.node.getId(), linkId: commonRoute.to.link.getId()},
		length: commonRoute.length
	}
}

async function findLongestCommonRoute(link: Link): Promise<{
	from: {node: AbstractNodeWidget, link: Link}
	to: {node: AbstractNodeWidget, link: Link}
	length: number
} | undefined> {
	const commonRoutes: {
		from: {node: AbstractNodeWidget, link: Link}
		to: {node: AbstractNodeWidget, link: Link}
		length: number
	}[] = []
	await linkBundler.findAndExtendCommonRoutes(link, 'from', commonRoutes)
	await linkBundler.findAndExtendCommonRoutes(link, 'to', commonRoutes)
	return linkBundler.getLongestCommonRoute(commonRoutes)
}

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