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
import { BoxData } from '../../dist/core/mapData/BoxData'
import { LocalPosition } from '../../dist/core/shape/LocalPosition'

test('findAndExtendCommonRoutes', async () => {
	await testUtil.initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 40, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: new BoxData('leftFolderTopFile', 20, 10, 60, 20, [], []), parent: leftFolder, addToParent: true, rendered: true})
	const rightTopFile = boxFactory.fileOf({idOrData: new BoxData('rightTopFile', 60, 20, 20, 20, [], []), parent: root, addToParent: true, rendered: true})
	const rightBottomFile = boxFactory.fileOf({idOrData: new BoxData('rightBottomFile', 60, 60, 20, 20, [], []), parent: root, addToParent: true, rendered: true})

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
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 40, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepFolder = boxFactory.folderOf({idOrData: 'leftDeepFolder', parent: leftFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepDeepFolder = boxFactory.folderOf({idOrData: 'leftDeepDeepFolder', parent: leftDeepFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepDeepFile = boxFactory.fileOf({idOrData: 'leftDeepDeepFile', parent: leftDeepDeepFolder, addToParent: true, rendered: true})
	const leftFileUnrenderSpy = jest.spyOn(leftDeepDeepFile, 'unrenderIfPossible').mockReturnValue(Promise.resolve({rendered: true})) // leads otherwise to undefined error
	const rightFile = boxFactory.fileOf({idOrData: new BoxData('rightFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})
	rightFile.body.render = () => Promise.resolve() // leads otherwise to undefined error

	const longLinkToRight: Link = await root.links.add({from: leftDeepDeepFile, to: rightFile, save: true})
	const shortLinkToRight: Link = await leftFolder.links.add({from: leftDeepDeepFolder, to: {node: leftFolder, positionInToNodeCoords: new LocalPosition(90, 50)}, save: true})
	const longLinkToLeft: Link = await root.links.add({from: rightFile, to: leftDeepDeepFile, save: true})
	const shortLinkToLeft: Link = await leftFolder.links.add({from: {node: leftFolder, positionInFromNodeCoords: new LocalPosition(90, 50)}, to: leftDeepDeepFolder, save: true})

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
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 40, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepFolder = boxFactory.folderOf({idOrData: 'leftDeepFolder', parent: leftFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepDeepFolder = boxFactory.folderOf({idOrData: 'leftDeepDeepFolder', parent: leftDeepFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepDeepFile = boxFactory.fileOf({idOrData: 'leftDeepDeepFile', parent: leftDeepDeepFolder, addToParent: true, rendered: true})
	const leftFileUnrenderSpy = jest.spyOn(leftDeepDeepFile, 'unrenderIfPossible').mockReturnValue(Promise.resolve({rendered: true})) // leads otherwise to undefined error
	const rightFile = boxFactory.fileOf({idOrData: new BoxData('rightFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})
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
	const leftFolder: FolderBox = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 40, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('leftFolderKnot', 100, 50))
	const leftInnerFolder: FolderBox = boxFactory.folderOf({idOrData: 'leftInnerFolder', parent: leftFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftDeepFile: FileBox = boxFactory.fileOf({idOrData: 'leftDeepFile', parent: leftInnerFolder, addToParent: true, rendered: true})
	const rightFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('rightFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})

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

test('findAndExtendCommonRoutes, two commonRoutes with same length, one ends already with a knot', async () => {
	await testUtil.initServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('leftFile', 10, 40, 30, 20, [], []), parent: root, addToParent: true, rendered: true})
	const rightFolder: FolderBox = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolderTopFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('rightFolderTopFile', 20, 10, 60, 30, [], []), parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('rightFolderBottomFile', 20, 60, 60, 30, [], []), parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderKnot: NodeWidget = await rightFolder.nodes.add(new NodeData('rightFolderKnot', 0, 50))

	const toFolder: Link = await root.links.add({from: leftFile, to: rightFolder, save: true})
	const toKnot: Link = await root.links.add({from: leftFile, to: rightFolderKnot, save: true})
	const toBottom: Link = await root.links.add({from: leftFile, to: rightFolderBottomFile, save: true})
	const toTop: Link = await root.links.add({from: leftFile, to: rightFolderTopFile, save: true})

	expect(extractIds((await commonRouteFinder.findLongestCommonRoute(toTop)))).toEqual(extractIds({
		links: [toKnot],
		from: leftFile,
		to: rightFolderKnot,
		length: 1
	}))
})

test('findAndExtendCommonRoutes, links are on different sides, other link is on top side', async () => {
	await testFindAndExtendCommonRoutesLinksAreOnDifferentSides(new LocalPosition(45, 20))
})

test('findAndExtendCommonRoutes, links are on different sides, other link is on right side', async () => {
	await testFindAndExtendCommonRoutesLinksAreOnDifferentSides(new LocalPosition(80, 45))
})

test('findAndExtendCommonRoutes, links are on different sides, other link is on bottom side', async () => {
	await testFindAndExtendCommonRoutesLinksAreOnDifferentSides(new LocalPosition(45, 80))
})

async function testFindAndExtendCommonRoutesLinksAreOnDifferentSides(otherFilePosition: LocalPosition): Promise<void> {
	await testUtil.initServicesWithMocks()
	
	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('leftFile', 10, 45, 10, 10, [], []), parent: root, addToParent: true, rendered: true})
	const centerFolder: FolderBox = boxFactory.folderOf({idOrData: new BoxData('centerFolder', 30, 30, 40, 40, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const centerFolderFile: FileBox = boxFactory.fileOf({idOrData: 'centerFolderFile', parent: centerFolder, addToParent: true, rendered: true})
	const otherFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('otherFile', otherFilePosition.percentX, otherFilePosition.percentY, 10, 10, [], []), parent: root, addToParent: true, rendered: true})
	
	const linkFromLeftFile: Link = await root.links.add({from: leftFile, to: centerFolderFile, save: true})
	const linkFromOtherFile: Link = await root.links.add({from: otherFile, to: centerFolderFile, save: true})
	const linkToLeftFile: Link = await root.links.add({from: centerFolderFile, to: leftFile, save: true})
	const linkToOtherFile: Link = await root.links.add({from: centerFolderFile, to: otherFile, save: true})
	
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(linkFromLeftFile))).toBe(undefined)
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(linkFromOtherFile))).toBe(undefined)
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(linkToLeftFile))).toBe(undefined)
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(linkToOtherFile))).toBe(undefined)
}

test('findAndExtendCommonRoutes, longLink on other side, shortLink on same side', async () => {
	await testUtil.initServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('leftFile', 10, 45, 10, 10, [], []), parent: root, addToParent: true, rendered: true})
	const centerFolder: FolderBox = boxFactory.folderOf({idOrData: new BoxData('centerFolder', 30, 30, 40, 40, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const centerInnerFolder: FolderBox = boxFactory.folderOf({idOrData: 'centerInnerFolder', parent: centerFolder, addToParent: true, rendered: true, bodyRendered: true})
	const centerInnerFolderFile: FileBox = boxFactory.fileOf({idOrData: 'centerInnerFolderFile', parent: centerInnerFolder, addToParent: true, rendered: true})
	const rightFile: FileBox = boxFactory.fileOf({idOrData: new BoxData('rightFile', 80, 45, 10, 10, [], []), parent: root, addToParent: true, rendered: true})

	const longLinkFromLeft: Link = await root.links.add({from: leftFile, to: centerInnerFolderFile, save: true})
	const shortLinkFromLeft: Link = await centerFolder.links.add({from: {node: centerFolder, positionInFromNodeCoords: new LocalPosition(10, 50)}, to: centerInnerFolderFile, save: true})
	const longLinkFromRight: Link = await root.links.add({from: rightFile, to: centerInnerFolderFile, save: true})

	const longLinkToLeft: Link = await root.links.add({from: centerInnerFolderFile, to: leftFile, save: true})
	const shortLinkToLeft: Link = await centerFolder.links.add({from: centerInnerFolderFile, to: {node: centerFolder, positionInToNodeCoords: new LocalPosition(10, 50)}, save: true})
	const longLinkToRight: Link = await root.links.add({from: centerInnerFolderFile, to: rightFile, save: true})

	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkFromLeft))).toEqual(extractIds({
		links: [shortLinkFromLeft],
		from: centerInnerFolder,
		to: centerInnerFolderFile,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkFromLeft))).toEqual(extractIds({
		links: [longLinkFromLeft],
		from: centerInnerFolder,
		to: centerInnerFolderFile,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkFromRight))).toBe(undefined)

	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkToLeft))).toEqual(extractIds({
		links: [shortLinkToLeft],
		from: centerInnerFolderFile,
		to: centerInnerFolder,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkToLeft))).toEqual(extractIds({
		links: [longLinkToLeft],
		from: centerInnerFolderFile,
		to: centerInnerFolder,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkToRight))).toBe(undefined)
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