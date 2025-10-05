//import * as testUtil from '../../test/testUtil' // would result in other modules as they would be loaded from 'src' and not from 'dist'
import * as testUtil from './testUtil/testUtil'
//import * as boxFactory from '../../test/core/box/factories/boxFactory' // would result in other modules as they would be loaded from 'src' and not from 'dist'
import * as boxFactory from './testUtil/boxFactory'
import * as commonRouteFinder from './commonRouteFinder'
import { Link } from '../../src/core/link/Link'
import { AbstractNodeWidget } from '../../src/core/AbstractNodeWidget'
import { NodeData } from '../../src/core/mapData/NodeData'
import { NodeWidget } from '../../src/core/node/NodeWidget'
import { RootFolderBox } from '../../src/core/box/RootFolderBox'
import { FolderBox } from '../../src/core/box/FolderBox'
import { FileBox } from '../../src/core/box/FileBox'
import { HoverManager } from '../../src/core/HoverManager'
import { BoxData } from '../../src/core/mapData/BoxData'
import { LocalPosition } from '../../src/core/shape/LocalPosition'
import { CommonRoute } from './CommonRoute'
import { LocalRect } from '../../src/core/LocalRect'

test('findLongestCommonRoute', async () => {
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
		knots: [],
		from: leftFolder,
		to: rightTopFile,
		length: 1
	})
})

test('findLongestCommonRoute, different managingBoxes of links', async () => {
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
		knots: [],
		from: leftDeepDeepFolder,
		to: leftDeepFolder,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkToRight))).toEqual(extractIds({
		links: [longLinkToRight],
		knots: [],
		from: leftDeepDeepFolder,
		to: leftDeepFolder,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkToLeft))).toEqual(extractIds({
		links: [shortLinkToLeft],
		knots: [],
		from: leftDeepFolder,
		to: leftDeepDeepFolder,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkToLeft))).toEqual(extractIds({
		links: [longLinkToLeft],
		knots: [],
		from: leftDeepFolder,
		to: leftDeepDeepFolder,
		length: 1
	}))
	expect(leftFileUnrenderSpy).toBeCalled()
})

/*test('findLongestCommonRoute, longer commonRoute', async () => {
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
		knots: [],
		from: leftDeepDeepFolder,
		to: leftFolder,
		length: 2
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkToRight))).toEqual(extractIds({
		links: [longLinkToRight],
		knots: [],
		from: leftDeepDeepFolder,
		to: leftFolder,
		length: 2
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkToLeft))).toEqual(extractIds({
		links: [shortLinkToLeft],
		knots: [],
		from: leftFolder,
		to: leftDeepDeepFolder,
		length: 2
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkToLeft))).toEqual(extractIds({
		links: [longLinkToLeft],
		knots: [],
		from: leftFolder,
		to: leftDeepDeepFolder,
		length: 2
	}))
	expect(leftFileUnrenderSpy).toBeCalled()
})*/

/*test('findLongestCommonRoute, node in commonRoute', async () => {
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
		knots: [leftFolderKnot],
		from: leftInnerFolder,
		to: leftFolder,
		length: 1
	}))
	expect(extractIds((await commonRouteFinder.findLongestCommonRoute(linkToLeft)))).toEqual(extractIds({
		links: routeToLeft,
		knots: [leftFolderKnot],
		from: leftFolder,
		to: leftInnerFolder,
		length: 1
	}))

	HoverManager.removeHoverable(leftFolderKnot)
})*/

test('findLongestCommonRoute, two commonRoutes with same length, one ends already with a knot', async () => {
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
		knots: [rightFolderKnot],
		from: leftFile,
		to: rightFolderKnot,
		length: 1
	}))
})

test('findLongestCommonRoute, links are on different sides, other link is on top side', async () => {
	await testFindLongestCommonRouteLinksAreOnDifferentSides(new LocalPosition(45, 20))
})

test('findLongestCommonRoute, links are on different sides, other link is on right side', async () => {
	await testFindLongestCommonRouteLinksAreOnDifferentSides(new LocalPosition(80, 45))
})

test('findLongestCommonRoute, links are on different sides, other link is on bottom side', async () => {
	await testFindLongestCommonRouteLinksAreOnDifferentSides(new LocalPosition(45, 80))
})

async function testFindLongestCommonRouteLinksAreOnDifferentSides(otherFilePosition: LocalPosition): Promise<void> {
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

test('findLongestCommonRoute, longLink on other side, shortLink on same side', async () => {
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
		knots: [],
		from: centerInnerFolder,
		to: centerInnerFolderFile,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkFromLeft))).toEqual(extractIds({
		links: [longLinkFromLeft],
		knots: [],
		from: centerInnerFolder,
		to: centerInnerFolderFile,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkFromRight))).toBe(undefined)

	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkToLeft))).toEqual(extractIds({
		links: [shortLinkToLeft],
		knots: [],
		from: centerInnerFolderFile,
		to: centerInnerFolder,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(shortLinkToLeft))).toEqual(extractIds({
		links: [longLinkToLeft],
		knots: [],
		from: centerInnerFolderFile,
		to: centerInnerFolder,
		length: 1
	}))
	expect(extractIds(await commonRouteFinder.findLongestCommonRoute(longLinkToRight))).toBe(undefined)
})

type PlainCommonRoute = {
	links: Link[]
	knots: NodeWidget[]
	from: AbstractNodeWidget
	to: AbstractNodeWidget
	length: number
}

function extractIds(commonRoute: CommonRoute | PlainCommonRoute | undefined): {
	links: string[]
	knots: string[]
	from: string
	to: string
	length: number
} | undefined {
	if (!commonRoute) {
		return undefined
	}
	commonRoute = commonRoute as PlainCommonRoute // cast to access private fields
	return {
		links: commonRoute.links.map(link => link.getId()),
		knots: commonRoute.knots.map(knot => knot.getId()),
		from: commonRoute.from.getId(),
		to: commonRoute.to.getId(),
		length: commonRoute.length
	}
}

test('canLinksBeBundled', () => {
	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(100, 50), to: new LocalPosition(200, 50)},
		{from: new LocalPosition(50, 50), to: new LocalPosition(200, 50)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)
	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(0, 50), to: new LocalPosition(-100, 50)},
		{from: new LocalPosition(50, 50), to: new LocalPosition(-100, 50)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)
	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(50, 0), to: new LocalPosition(-100, 50)},
		{from: new LocalPosition(50, 50), to: new LocalPosition(-100, 50)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)
	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(50, 100), to: new LocalPosition(50, 200)},
		{from: new LocalPosition(50, 50), to: new LocalPosition(50, 200)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)

	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(50, 100), to: new LocalPosition(50, -100)},
		{from: new LocalPosition(50, 50), to: new LocalPosition(50, -100)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)
	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(0, 50), to: new LocalPosition(50, 200)},
		{from: new LocalPosition(50, 50), to: new LocalPosition(50, 200)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)
	
	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(100, 50), to: new LocalPosition(50, 200)},
		{from: new LocalPosition(50, 50), to: new LocalPosition(50, 200)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)
	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(50, 50), to: new LocalPosition(50, 200)},
		{from: new LocalPosition(100, 50), to: new LocalPosition(50, 200)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)

	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(100.00001, 50), to: new LocalPosition(50, 200)},
		{from: new LocalPosition(50, 50), to: new LocalPosition(50, 200)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)
	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(50, 50), to: new LocalPosition(200, 50)},
		{from: new LocalPosition(100.00001, 50), to: new LocalPosition(200, 50)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)
	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(50, -0.00001), to: new LocalPosition(50, -100)},
		{from: new LocalPosition(50, 50), to: new LocalPosition(50, -100)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)
	expect(commonRouteFinder.canLinksBeBundled(
		{from: new LocalPosition(50, -100), to: new LocalPosition(50, -0.00001)},
		{from: new LocalPosition(50, -100), to: new LocalPosition(50, 50)},
		new LocalRect(0, 0, 100, 100)
	)).toBe(true)
})