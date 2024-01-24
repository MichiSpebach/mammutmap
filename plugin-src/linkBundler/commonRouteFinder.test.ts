//import * as testUtil from '../../test/testUtil' // would result in other modules as they would be loaded from 'src' and not from 'dist'
import * as testUtil from './testUtil/testUtil'
//import * as boxFactory from '../../test/core/box/factories/boxFactory' // would result in other modules as they would be loaded from 'src' and not from 'dist'
import * as boxFactory from './testUtil/boxFactory'
import * as commonRouteFinder from './commonRouteFinder'
import { Link } from '../../dist/core/link/Link'
import { AbstractNodeWidget } from '../../dist/core/AbstractNodeWidget'
import { NodeData } from '../../dist/core/mapData/NodeData'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { RootFolderBox } from '../../dist/core/box/RootFolderBox'
import { FolderBox } from '../../dist/core/box/FolderBox'
import { FileBox } from '../../dist/core/box/FileBox'
import { HoverManager } from '../../dist/core/HoverManager'

test('findAndExtendCommonRoutes', async () => {
	await testUtil.initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: 'leftFolder', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightTopFile = boxFactory.fileOf({idOrData: 'rightTopFile', parent: root, addToParent: true, rendered: true})
	const rightBottomFile = boxFactory.fileOf({idOrData: 'rightBottomFile', parent: root, addToParent: true, rendered: true})

	const topLink: Link = await root.links.add({from: leftFolderTopFile, to: rightTopFile, save: true})
	const unaffectedBottomLink: Link = await root.links.add({from: leftFolder, to: rightBottomFile, save: true})
	const bottomLeftToTopRightLink: Link = await root.links.add({from: leftFolder, to: rightTopFile, save: true})

	const longestCommonRoute = await commonRouteFinder.findLongestCommonRoute(topLink)

	expect(longestCommonRoute).toEqual({
		links: [bottomLeftToTopRightLink],
		from: leftFolder,
		to: rightTopFile,
		length: 1
	})
})

test('findAndExtendCommonRoutes, different managingBoxes of links', async () => {
	await testUtil.initServicesWithMocks()

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

	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkToRight))).toEqual(extractIds({
		links: [shortLinkToRight],
		from: leftDeepDeepFolder,
		to: leftDeepFolder,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkToRight))).toEqual(extractIds({
		links: [longLinkToRight],
		from: leftDeepDeepFolder,
		to: leftDeepFolder,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkToLeft))).toEqual(extractIds({
		links: [shortLinkToLeft],
		from: leftDeepFolder,
		to: leftDeepDeepFolder,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkToLeft))).toEqual(extractIds({
		links: [longLinkToLeft],
		from: leftDeepFolder,
		to: leftDeepDeepFolder,
		length: 1
	}))
	expect(leftFileUnrenderSpy).toBeCalled()
})

test('findAndExtendCommonRoutes, longer commonRoute', async () => {
	await testUtil.initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: 'leftFolder', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepFolder = boxFactory.folderOf({idOrData: 'leftDeepFolder', parent: leftFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepDeepFolder = boxFactory.folderOf({idOrData: 'leftDeepDeepFolder', parent: leftDeepFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepDeepFile = boxFactory.fileOf({idOrData: 'leftDeepDeepFile', parent: leftDeepDeepFolder, addToParent: true, rendered: true})
	const leftFileUnrenderSpy = jest.spyOn(leftDeepDeepFile, 'unrenderIfPossible').mockReturnValue(Promise.resolve({rendered: true})) // leads otherwise to undefined error
	const rightFile = boxFactory.fileOf({idOrData: 'rightFile', parent: root, addToParent: true, rendered: true})
	rightFile.body.render = () => Promise.resolve() // leads otherwise to undefined error

	const longLinkToRight: Link = await root.links.add({from: leftDeepDeepFile, to: rightFile, save: true})
	const shortLinkToRight: Link = await root.links.add({from: leftDeepDeepFolder, to: root, save: true})
	const longLinkToLeft: Link = await root.links.add({from: rightFile, to: leftDeepDeepFile, save: true})
	const shortLinkToLeft: Link = await root.links.add({from: root, to: leftDeepDeepFolder, save: true})

	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkToRight))).toEqual(extractIds({
		links: [shortLinkToRight],
		from: leftDeepDeepFolder,
		to: leftFolder,
		length: 2
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkToRight))).toEqual(extractIds({
		links: [longLinkToRight],
		from: leftDeepDeepFolder,
		to: leftFolder,
		length: 2
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkToLeft))).toEqual(extractIds({
		links: [shortLinkToLeft],
		from: leftFolder,
		to: leftDeepDeepFolder,
		length: 2
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkToLeft))).toEqual(extractIds({
		links: [longLinkToLeft],
		from: leftFolder,
		to: leftDeepDeepFolder,
		length: 2
	}))
	expect(leftFileUnrenderSpy).toBeCalled()
})

test('findAndExtendCommonRoutes, node in commonRoute', async () => {
	await testUtil.initServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder: FolderBox = boxFactory.folderOf({idOrData: 'leftFolder', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('leftFolderKnot', 100, 50))
	const leftInnerFolder: FolderBox = boxFactory.folderOf({idOrData: 'leftInnerFolder', parent: leftFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepFile: FileBox = boxFactory.fileOf({idOrData: 'leftDeepFile', parent: leftInnerFolder, addToParent: true, rendered: true})
	const rightFile: FileBox = boxFactory.fileOf({idOrData: 'rightFile', parent: root, addToParent: true, rendered: true})

	const routeToRight: Link[] = [
		await leftFolder.links.add({from: leftDeepFile, to: leftFolderKnot, save: true}),
		await root.links.add({from: leftFolderKnot, to: rightFile, save: true})
	]
	const linkToRight: Link = await root.links.add({from: leftInnerFolder, to: root, save: true})
	const routeToLeft: Link[] = [
		await root.links.add({from: rightFile, to: leftFolderKnot, save: true}),
		await leftFolder.links.add({from: leftFolderKnot, to: leftDeepFile, save: true})
	]
	const linkToLeft: Link = await root.links.add({from: root, to: leftInnerFolder, save: true})

	expect(extractIds((await commonRouteFinder.findLongestCommonRoute(linkToRight)))).toEqual(extractIds({
		links: routeToRight,
		from: leftInnerFolder,
		to: leftFolder,
		length: 1
	}))
	expect(extractIds((await commonRouteFinder.findLongestCommonRoute(linkToLeft)))).toEqual(extractIds({
		links: routeToLeft,
		from: leftFolder,
		to: leftInnerFolder,
		length: 1
	}))

	HoverManager.removeHoverable(leftFolderKnot)
})

function extractIds(commonRoute: {
	links: Link[]
	from: AbstractNodeWidget
	to: AbstractNodeWidget
	length: number
} | undefined): {
	links: string[]
	from: string
	to: string
	length: number
} | undefined {
	if (!commonRoute) {
		return undefined
	}
	return {
		links: commonRoute.links.map(link => link.getId()),
		from: commonRoute.from.getId(),
		to: commonRoute.to.getId(),
		length: commonRoute.length
	}
}