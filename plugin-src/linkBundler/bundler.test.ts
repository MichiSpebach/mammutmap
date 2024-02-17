//import * as testUtil from '../../test/testUtil' // would result in other modules as they would be loaded from 'src' and not from 'dist'
import * as testUtil from './testUtil/testUtil'
//import * as boxFactory from '../../test/core/box/factories/boxFactory' // would result in other modules as they would be loaded from 'src' and not from 'dist'
import * as boxFactory from './testUtil/boxFactory'
import * as linkBundler from './bundler'
import { BoxLinks } from '../../dist/core/box/BoxLinks'
import { Link } from '../../dist/core/link/Link'
import { NodeData } from '../../dist/core/mapData/NodeData'
import { NodeWidget } from '../../dist/core/node/NodeWidget'
import { HoverManager } from '../../dist/core/HoverManager'
import { BoxData } from '../../dist/core/mapData/BoxData'
import { HighlightPropagatingLink } from './HighlightPropagatingLink'

test('bundleLink, nothing to bundle', async () => {
	await testUtil.initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const fileA = boxFactory.fileOf({idOrData: 'fileA', parent: root, addToParent: true, rendered: true})
	const fileB = boxFactory.fileOf({idOrData: 'fileB', parent: root, addToParent: true, rendered: true})
	const link = await root.links.add({from: fileA, to: fileB, save: true})

	await linkBundler.bundleLink(link)

	expect(link.getData().from.path.map(waypoint => waypoint.boxId)).toEqual(['fileA'])
	expect(link.getData().to.path.map(waypoint => waypoint.boxId)).toEqual(['fileB'])
})

test('bundleLink, insert one node', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const rightFile = boxFactory.fileOf({idOrData: new BoxData('rootFolderFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 40, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	
	const topLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFile, save: true})
	const bottomLink: Link = await root.links.add({from: leftFolderBottomFile, to: rightFile, save: true})
	
	await linkBundler.bundleLink(topLink)

	const topLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderTopFile, rightFile)!
	expect(topLinkRoute.length).toBe(2)
	expect(topLinkRoute[0].getId()).toBe(topLink.getId())
	expect(topLinkRoute[1].getId()).toBe(bottomLink.getId())
	expect(topLinkRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])

	const bottomLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFile)!
	expect(bottomLinkRoute.length).toBe(2)
	expect(bottomLinkRoute[1].getId()).toBe(bottomLink.getId())
	expect(bottomLinkRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])
	
	expect(topLink.getData().from.path.map(waypoint => waypoint.boxId)).toEqual(['leftFolderTopFile'])
	expect(topLink.getData().to.path.map(waypoint => waypoint.boxId)).toEqual([expect.stringContaining('node')])
})

test('bundleLink, insert two nodes', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})
	
	const topLink = await root.links.add({from: leftFolderTopFile, to: rightFolderTopFile, save: true})
	const bottomLink = await root.links.add({from: leftFolderBottomFile, to: rightFolderBottomFile, save: true})

	await linkBundler.bundleLink(topLink)
	
	const topLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)!
	expect(topLinkRoute.length).toBe(3)
	expect(topLinkRoute[0].getId()).toBe(topLink.getId())
	expect(topLinkRoute[1].getId()).toBe(bottomLink.getId())
	expect(topLinkRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [topLink.getId()]])

	const bottomLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)!
	expect(bottomLinkRoute.length).toBe(3)
	expect(bottomLinkRoute[1].getId()).toBe(bottomLink.getId())
	expect(bottomLinkRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [expect.anything()]])
})

test('bundleLink, insert two nodes, both inserts in from part, bundling longLink', async () => {
	await testBundleLinkBothInsertsInFromPart('longLink')
})

test('bundleLink, insert two nodes, both inserts in from part, bundling shortLink', async () => {
	await testBundleLinkBothInsertsInFromPart('shortLink')
})

async function testBundleLinkBothInsertsInFromPart(linkToBundle: 'longLink'|'shortLink'): Promise<void> {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftInnerFolder = boxFactory.folderOf({idOrData: 'leftInnerFolder', parent: leftFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftFile = boxFactory.fileOf({idOrData: 'leftFile', parent: leftInnerFolder, addToParent: true, rendered: true})
	const rightFile = boxFactory.fileOf({idOrData: new BoxData('rightFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})

	const longLink: Link = await root.links.add({from: leftFile, to: rightFile, save: true})
	const shortLink: Link = await root.links.add({from: leftInnerFolder, to: root, save: true})

	await linkBundler.bundleLink({longLink, shortLink}[linkToBundle])
	
	const longRoute: Link[] = BoxLinks.findLinkRoute(leftFile, rightFile)!
	expect(longRoute.length).toBe(3)
	expect(longRoute[2].getId()).toBe(longLink.getId())
	expect(longRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[longLink.getId()], [], [expect.anything()]])

	const shortRoute: Link[] = BoxLinks.findLinkRoute(leftInnerFolder, root)!
	expect(shortRoute.length).toBe(3)
	expect(shortRoute[2].getId()).toBe(shortLink.getId())
	expect(shortRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[shortLink.getId()], [], [expect.anything()]])

	expect(longRoute[1].getId()).toBe(shortRoute[1].getId())
}

test('bundleLink, insert two nodes, both inserts in to part, bundling longLink', async () => {
	await testBundleLinkBothInsertsInToPart('longLink')
})

test('bundleLink, insert two nodes, both inserts in to part, bundling shortLink', async () => {
	await testBundleLinkBothInsertsInToPart('shortLink')
})

async function testBundleLinkBothInsertsInToPart(linkToBundle: 'longLink'|'shortLink'): Promise<void> {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftInnerFolder = boxFactory.folderOf({idOrData: 'leftInnerFolder', parent: leftFolder, addToParent: true, rendered: true, bodyRendered: true})
	const leftFile = boxFactory.fileOf({idOrData: 'leftFile', parent: leftInnerFolder, addToParent: true, rendered: true})
	const rightFile = boxFactory.fileOf({idOrData: new BoxData('rightFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})

	const longLink: Link = await root.links.add({from: rightFile, to: leftFile, save: true})
	const shortLink: Link = await root.links.add({from: root, to: leftInnerFolder, save: true})
	let shortRouteTest: Link[] = BoxLinks.findLinkRoute(root, leftInnerFolder)!
	expect(shortRouteTest.length).toBe(1) // two because start link is not in there because following link also starts from leftInnerFolder

	await linkBundler.bundleLink({longLink, shortLink}[linkToBundle])
	
	const longRoute: Link[] = BoxLinks.findLinkRoute(rightFile, leftFile)!
	expect(longRoute.length).toBe(3)
	expect(longRoute[0].getId()).toBe(longLink.getId())
	expect(longRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [longLink.getId()]])

	const shortRoute: Link[] = BoxLinks.findLinkRoute(root, leftInnerFolder)!
	expect(shortRoute.length).toBe(3)
	expect(shortRoute[0].getId()).toBe(shortLink.getId())
	expect(shortRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [shortLink.getId()]])

	expect(longRoute[1].getId()).toBe(shortRoute[1].getId())
}

test('bundleLink, commonRoute startLink starts at LinkNode', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const rightFile = boxFactory.fileOf({idOrData: new BoxData('rightFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('leftFolderKnot', 100, 50))
	const leftFolderFile = boxFactory.fileOf({idOrData: 'leftFolderFile', parent: leftFolder, addToParent: true, rendered: true})

	const linkRoute: Link[] = [
		await leftFolder.links.add({from: leftFolderFile, to: leftFolderKnot, save: true}),
		await root.links.add({from: leftFolderKnot, to: rightFile, save: true})
	]
	const link: Link = await root.links.add({from: leftFolder, to: rightFile, save: true})

	await linkBundler.bundleLink(link)
	
	const linkRouteFromLeftFolderFile: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile, rightFile)
	expect(linkRouteFromLeftFolderFile?.map(link => link.getId())).toEqual(linkRoute.map(link => link.getId()))
	const linkRouteFromLeftFolder: Link[]|undefined = BoxLinks.findLinkRoute(leftFolder, rightFile)
	expect(linkRouteFromLeftFolder?.length).toBe(2)
	expect(linkRouteFromLeftFolder?.at(0)).toBe(link)
	expect(linkRouteFromLeftFolder?.at(1)).toBe(linkRoute.at(1))
	expect(linkRouteFromLeftFolder?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('leftFolder')
	expect(linkRouteFromLeftFolder?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromLeftFolder?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromLeftFolder?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('rightFile')
	expect(linkRouteFromLeftFolder?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])

	HoverManager.removeHoverable(leftFolderKnot)
})

test('bundleLink, commonRoute endLink ends at LinkNode', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const rightFile = boxFactory.fileOf({idOrData: new BoxData('rightFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('leftFolderKnot', 100, 50))
	const leftFolderFile = boxFactory.fileOf({idOrData: 'leftFolderFile', parent: leftFolder, addToParent: true, rendered: true})

	const linkRoute: Link[] = [
		await root.links.add({from: rightFile, to: leftFolderKnot, save: true}),
		await leftFolder.links.add({from: leftFolderKnot, to: leftFolderFile, save: true})
	]
	const link: Link = await root.links.add({from: rightFile, to: leftFolder, save: true})

	await linkBundler.bundleLink(link)
	
	const linkRouteToLeftFolderFile: Link[]|undefined = BoxLinks.findLinkRoute(rightFile, leftFolderFile)
	expect(linkRouteToLeftFolderFile?.map(link => link.getId())).toEqual(linkRoute.map(link => link.getId()))
	const linkRouteToLeftFolder: Link[]|undefined = BoxLinks.findLinkRoute(rightFile, leftFolder)
	expect(linkRouteToLeftFolder?.length).toBe(2)
	expect(linkRouteToLeftFolder?.at(0)).toBe(linkRoute.at(0))
	expect(linkRouteToLeftFolder?.at(1)).toBe(link)
	expect(linkRouteToLeftFolder?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('rightFile')
	expect(linkRouteToLeftFolder?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToLeftFolder?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToLeftFolder?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('leftFolder')
	expect(linkRouteToLeftFolder?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])

	HoverManager.removeHoverable(leftFolderKnot)
})

test('bundleLink, commonRoute starts with LinkNode', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const rightFile = boxFactory.fileOf({idOrData: new BoxData('rightFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('leftFolderKnot', 100, 50))
	const leftFolderFile = boxFactory.fileOf({idOrData: 'leftFolderFile', parent: leftFolder, addToParent: true, rendered: true})

	const linkRoute: Link[] = [
		await leftFolder.links.add({from: leftFolderFile, to: leftFolderKnot, save: true}),
		await root.links.add({from: leftFolderKnot, to: rightFile, save: true})
	]
	const link: Link = await root.links.add({from: leftFolderFile, to: root, save: true})

	await linkBundler.bundleLink(link)
	
	const linkRouteToRightFile: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile, rightFile)
	expect(linkRouteToRightFile?.map(link => link.getId())).toEqual(linkRoute.map(link => link.getId()))
	const linkRouteToRoot: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile, root)
	expect(linkRouteToRoot?.length).toBe(2)
	expect(linkRouteToRoot?.at(0)).toBe(linkRoute.at(0))
	expect(linkRouteToRoot?.at(1)).toBe(link)
	expect(linkRouteToRoot?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderFile')
	expect(linkRouteToRoot?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToRoot?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToRoot?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('root')
	expect(linkRouteToRoot?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])

	HoverManager.removeHoverable(leftFolderKnot)
})

test('bundleLink, commonRoute ends with LinkNode', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const rightFile = boxFactory.fileOf({idOrData: new BoxData('rightFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('leftFolderKnot', 100, 50))
	const leftFolderFile = boxFactory.fileOf({idOrData: 'leftFolderFile', parent: leftFolder, addToParent: true, rendered: true})

	const linkRoute: Link[] = [
		await root.links.add({from: rightFile, to: leftFolderKnot, save: true}),
		await leftFolder.links.add({from: leftFolderKnot, to: leftFolderFile, save: true})
	]
	const link: Link = await root.links.add({from: root, to: leftFolderFile, save: true})

	await linkBundler.bundleLink(link)
	
	const linkRouteFromRightFile: Link[]|undefined = BoxLinks.findLinkRoute(rightFile, leftFolderFile)
	expect(linkRouteFromRightFile?.map(link => link.getId())).toEqual(linkRoute.map(link => link.getId()))
	const linkRouteFromRoot: Link[]|undefined = BoxLinks.findLinkRoute(root, leftFolderFile)
	expect(linkRouteFromRoot?.length).toBe(2)
	expect(linkRouteFromRoot?.at(0)).toBe(link)
	expect(linkRouteFromRoot?.at(1)).toBe(linkRoute.at(1))
	expect(linkRouteFromRoot?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('root')
	expect(linkRouteFromRoot?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromRoot?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromRoot?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderFile')
	expect(linkRouteFromRoot?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])

	HoverManager.removeHoverable(leftFolderKnot)
})

test('bundleLink, linkToRootKnot', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const file = boxFactory.fileOf({idOrData: new BoxData('file', 10, 40, 40, 20, [], []), parent: root, addToParent: true, rendered: true})
	const fileKnot: NodeWidget = await file.nodes.add(new NodeData('fileKnot', 50, 50))
	const rootKnot: NodeWidget = await root.nodes.add(new NodeData('rootKnot', 60, 50))

	const linkBetweenKnots: Link = await root.links.add({from: fileKnot, to: rootKnot, save: true})
	const linkToRootKnot: Link = await root.links.add({from: file, to: rootKnot, save: true})

	await linkBundler.bundleLink(linkToRootKnot)

	const linkRouteToRootKnot: Link[]|undefined = BoxLinks.findLinkRoute(file, rootKnot)
	expect(linkRouteToRootKnot?.map(link => link.getId())).toEqual([linkToRootKnot, linkBetweenKnots].map(link => link.getId()))
	expect(linkRouteToRootKnot?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])

	HoverManager.removeHoverable(rootKnot)
	HoverManager.removeHoverable(fileKnot)
})

test('bundleLink, linkFromRootKnot', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const file = boxFactory.fileOf({idOrData: new BoxData('file', 10, 40, 40, 20, [], []), parent: root, addToParent: true, rendered: true})
	const fileKnot: NodeWidget = await file.nodes.add(new NodeData('fileKnot', 50, 50))
	const rootKnot: NodeWidget = await root.nodes.add(new NodeData('rootKnot', 60, 50))

	const linkBetweenKnots: Link = await root.links.add({from: rootKnot, to: fileKnot, save: true})
	const linkFromRootKnot: Link = await root.links.add({from: rootKnot, to: file, save: true})

	await linkBundler.bundleLink(linkFromRootKnot)

	const linkRouteFromRootKnot: Link[]|undefined = BoxLinks.findLinkRoute(rootKnot, file)
	expect(linkRouteFromRootKnot?.map(node => node.getId())).toEqual([linkBetweenKnots, linkFromRootKnot].map(node => node.getId()))
	expect(linkRouteFromRootKnot?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])

	HoverManager.removeHoverable(rootKnot)
	HoverManager.removeHoverable(fileKnot)
})

test('bundleLink, commonRoute and linkToBundle start with knots', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('leftFolderKnot', 100, 40))
	const otherLeftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('otherLeftFolderKnot', 100, 60))
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const topToKnot: Link = await leftFolder.links.add({from: leftFolderTopFile, to: leftFolderKnot, save: true})
	const bottomToKnot: Link = await leftFolder.links.add({from: leftFolderBottomFile, to: leftFolderKnot, save: true})
	const knotToRightTopFile: Link = await root.links.add({from: leftFolderKnot, to: rightFolderTopFile, save: true})
	const topToOtherKnot: Link = await leftFolder.links.add({from: leftFolderTopFile, to: otherLeftFolderKnot, save: true})
	const bottomToOtherKnot: Link = await leftFolder.links.add({from: leftFolderBottomFile, to: otherLeftFolderKnot, save: true})
	const otherKnotToRightBottomFile: Link = await root.links.add({from: otherLeftFolderKnot, to: rightFolderBottomFile, save: true})
	
	await linkBundler.bundleLink(otherKnotToRightBottomFile)

	expect(leftFolderTopFile.borderingLinks.getAll().length).toBe(1)
	expect(leftFolderBottomFile.borderingLinks.getAll().length).toBe(1)
	expect(rightFolderTopFile.borderingLinks.getAll().length).toBe(1)
	expect(rightFolderBottomFile.borderingLinks.getAll().length).toBe(1)
	expect(leftFolder.nodes.getNodes().map(knot => knot.getId())).toEqual([leftFolderKnot.getId()])

	const linkRouteFromTopToTop: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)
	const linkRouteFromTopToBottom: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderBottomFile)
	const linkRouteFromBottomToTop: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderTopFile)
	const linkRouteFromBottomToBottom: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)
	expect(linkRouteFromTopToTop?.map(node => node.getId())).toEqual([topToKnot.getId(), knotToRightTopFile.getId(), expect.anything()])
	expect(linkRouteFromTopToBottom?.map(node => node.getId())).toEqual([topToKnot.getId(), knotToRightTopFile.getId(), otherKnotToRightBottomFile.getId()])
	expect(linkRouteFromBottomToTop?.map(node => node.getId())).toEqual([bottomToKnot.getId(), knotToRightTopFile.getId(), expect.anything()])
	expect(linkRouteFromBottomToBottom?.map(node => node.getId())).toEqual([bottomToKnot.getId(), knotToRightTopFile.getId(), otherKnotToRightBottomFile.getId()])
	const linkToTopId: string|undefined = linkRouteFromTopToTop?.at(2)?.getId()
	expect(linkRouteFromBottomToTop?.at(2)?.getId()).toBe(linkToTopId)
	const linkToBottomId: string = otherKnotToRightBottomFile.getId()
	expect(linkRouteFromTopToTop?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[linkToTopId, linkToBottomId], [], [topToKnot.getId(), bottomToKnot.getId()]])
	expect(linkRouteFromTopToBottom?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[linkToTopId, linkToBottomId], [], [topToKnot.getId(), bottomToKnot.getId()]])
	expect(linkRouteFromBottomToTop?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[linkToTopId, linkToBottomId], [], [topToKnot.getId(), bottomToKnot.getId()]])
	expect(linkRouteFromBottomToBottom?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[linkToTopId, linkToBottomId], [], [topToKnot.getId(), bottomToKnot.getId()]])

	HoverManager.removeHoverable(leftFolderKnot)
})

test('bundleLink, commonRoute and linkToBundle end with knots', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('leftFolderKnot', 100, 40))
	const otherLeftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('otherLeftFolderKnot', 100, 60))
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const rightTopFileToKnot: Link = await root.links.add({from: rightFolderTopFile, to: leftFolderKnot, save: true})
	const knotToTop: Link = await leftFolder.links.add({from: leftFolderKnot, to: leftFolderTopFile, save: true})
	const knotToBottom: Link = await leftFolder.links.add({from: leftFolderKnot, to: leftFolderBottomFile, save: true})
	const rightBottomFileToOtherKnot: Link = await root.links.add({from: rightFolderBottomFile, to: otherLeftFolderKnot, save: true})
	const otherKnotToTop: Link = await leftFolder.links.add({from: otherLeftFolderKnot, to: leftFolderTopFile, save: true})
	const otherKnotToBottom: Link = await leftFolder.links.add({from: otherLeftFolderKnot, to: leftFolderBottomFile, save: true})
	
	await linkBundler.bundleLink(rightBottomFileToOtherKnot)

	expect(leftFolderTopFile.borderingLinks.getAll().length).toBe(1)
	expect(leftFolderBottomFile.borderingLinks.getAll().length).toBe(1)
	expect(rightFolderTopFile.borderingLinks.getAll().length).toBe(1)
	expect(rightFolderBottomFile.borderingLinks.getAll().length).toBe(1)
	expect(leftFolder.nodes.getNodes().map(knot => knot.getId())).toEqual([leftFolderKnot.getId()])

	const linkRouteFromTopToTop: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderTopFile, leftFolderTopFile)
	const linkRouteFromTopToBottom: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderTopFile, leftFolderBottomFile)
	const linkRouteFromBottomToTop: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderBottomFile, leftFolderTopFile)
	const linkRouteFromBottomToBottom: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderBottomFile, leftFolderBottomFile)
	expect(linkRouteFromTopToTop?.map(node => node.getId())).toEqual([expect.anything(), rightTopFileToKnot.getId(), knotToTop.getId()])
	expect(linkRouteFromTopToBottom?.map(node => node.getId())).toEqual([expect.anything(), rightTopFileToKnot.getId(), knotToBottom.getId()])
	expect(linkRouteFromBottomToTop?.map(node => node.getId())).toEqual([rightBottomFileToOtherKnot.getId(), rightTopFileToKnot.getId(), knotToTop.getId()])
	expect(linkRouteFromBottomToBottom?.map(node => node.getId())).toEqual([rightBottomFileToOtherKnot.getId(), rightTopFileToKnot.getId(), knotToBottom.getId()])
	const linkFromTopId: string|undefined = linkRouteFromTopToTop?.at(0)?.getId()
	expect(linkRouteFromTopToBottom?.at(0)?.getId()).toBe(linkFromTopId)
	const linkFromBottomId: string = rightBottomFileToOtherKnot.getId()
	expect(linkRouteFromTopToTop?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[knotToTop.getId(), knotToBottom.getId()], [], [linkFromTopId, linkFromBottomId]])
	expect(linkRouteFromTopToBottom?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[knotToTop.getId(), knotToBottom.getId()], [], [linkFromTopId, linkFromBottomId]])
	expect(linkRouteFromBottomToTop?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[knotToTop.getId(), knotToBottom.getId()], [], [linkFromTopId, linkFromBottomId]])
	expect(linkRouteFromBottomToBottom?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[knotToTop.getId(), knotToBottom.getId()], [], [linkFromTopId, linkFromBottomId]])

	HoverManager.removeHoverable(leftFolderKnot)
})

test('bundleLink, linkToBundle is connected to knot on toSide, commonRoute is not', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFile = boxFactory.fileOf({idOrData: new BoxData('leftFile', 10, 40, 30, 20, [], []), parent: root, addToParent: true, rendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolderKnot: NodeWidget = await rightFolder.nodes.add(new NodeData('rightFolderKnot', 0, 50))
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderMidFile = boxFactory.fileOf({idOrData: 'rightFolderMidFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const leftToRightFolderKnot: Link = await root.links.add({from: leftFile, to: rightFolderKnot, save: true})
	const rightFolderKnotToTopFile: Link = await rightFolder.links.add({from: rightFolderKnot, to: rightFolderTopFile, save: true})
	const rightFolderKnotToMidFile: Link = await rightFolder.links.add({from: rightFolderKnot, to: rightFolderMidFile, save: true})
	const leftToRightFolderBottomFile: Link = await root.links.add({from: leftFile, to: rightFolderBottomFile, save: true})

	await linkBundler.bundleLink(leftToRightFolderKnot)

	const routeToTopFile: Link[]|undefined = BoxLinks.findLinkRoute(leftFile, rightFolderTopFile)
	const routeToMidFile: Link[]|undefined = BoxLinks.findLinkRoute(leftFile, rightFolderMidFile)
	const routeToBottomFile: Link[]|undefined = BoxLinks.findLinkRoute(leftFile, rightFolderBottomFile)
	expect(routeToTopFile?.map(node => node.getId())).toEqual([leftToRightFolderBottomFile.getId(), rightFolderKnotToTopFile.getId()])
	expect(routeToMidFile?.map(node => node.getId())).toEqual([leftToRightFolderBottomFile.getId(), rightFolderKnotToMidFile.getId()])
	expect(routeToBottomFile?.map(node => node.getId())).toEqual([leftToRightFolderBottomFile.getId(), expect.anything()])
	expect(rightFolder.nodes.getNodes().map(node => node.getId())).toEqual([rightFolderKnot.getId()])
	expect(routeToTopFile?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])
	expect(routeToMidFile?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])
	expect(routeToBottomFile?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])

	HoverManager.removeHoverable(rightFolderKnot)
})

test('bundleLink, linkToBundle is connected to knot on fromSide, commonRoute is not', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFile = boxFactory.fileOf({idOrData: new BoxData('leftFile', 10, 40, 30, 20, [], []), parent: root, addToParent: true, rendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolderKnot: NodeWidget = await rightFolder.nodes.add(new NodeData('rightFolderKnot', 0, 50))
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderMidFile = boxFactory.fileOf({idOrData: 'rightFolderMidFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const topFileToKnot: Link = await rightFolder.links.add({from: rightFolderTopFile, to: rightFolderKnot, save: true})
	const midFileToKnot: Link = await rightFolder.links.add({from: rightFolderMidFile, to: rightFolderKnot, save: true})
	const knotToLeftFile: Link = await root.links.add({from: rightFolderKnot, to: leftFile, save: true})
	const bottomFileToLeftFile: Link = await root.links.add({from: rightFolderBottomFile, to: leftFile, save: true})

	await linkBundler.bundleLink(knotToLeftFile)

	const routeFromTopFile: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderTopFile, leftFile)
	const routeFromMidFile: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderMidFile, leftFile)
	const routeFromBottomFile: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderBottomFile, leftFile)
	expect(routeFromTopFile?.map(node => node.getId())).toEqual([topFileToKnot.getId(), bottomFileToLeftFile.getId()])
	expect(routeFromMidFile?.map(node => node.getId())).toEqual([midFileToKnot.getId(), bottomFileToLeftFile.getId()])
	expect(routeFromBottomFile?.map(node => node.getId())).toEqual([expect.anything(), bottomFileToLeftFile.getId()])
	expect(rightFolder.nodes.getNodes().map(node => node.getId())).toEqual([rightFolderKnot.getId()])
	expect(routeFromTopFile?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])
	expect(routeFromMidFile?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])
	expect(routeFromBottomFile?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])

	HoverManager.removeHoverable(rightFolderKnot)
})

test('bundleLink, commonRoute with knots already exist', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderMidFile = boxFactory.fileOf({idOrData: 'leftFolderMidFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderMidFile = boxFactory.fileOf({idOrData: 'rightFolderMidFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const topLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFolderTopFile, save: true})
	const midLink: Link = await root.links.add({from: leftFolderMidFile, to: rightFolderMidFile, save: true})
	await linkBundler.bundleLink(topLink)

	const bottomLink: Link = await root.links.add({from: leftFolderBottomFile, to: rightFolderBottomFile, save: true})
	await linkBundler.bundleLink(bottomLink)

	const topRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)
	const midRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderMidFile, rightFolderMidFile)
	const bottomRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)
	expect(topRoute?.map(node => node.getId())).toEqual([topLink.getId(), midLink.getId(), expect.anything()])
	expect(midRoute?.map(node => node.getId())).toEqual([expect.anything(), midLink.getId(), expect.anything()])
	expect(bottomRoute?.map(node => node.getId())).toEqual([bottomLink.getId(), midLink.getId(), expect.anything()])
	expect(topRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [topLink.getId()]])
	expect(midRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [expect.anything()]])
	expect(bottomRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [bottomLink.getId()]])
})

test('bundleLink, knots on from side need to be merged', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderFile1 = boxFactory.fileOf({idOrData: 'leftFolderFile1', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderFile2 = boxFactory.fileOf({idOrData: 'leftFolderFile2', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderFile3 = boxFactory.fileOf({idOrData: 'leftFolderFile3', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderFile4 = boxFactory.fileOf({idOrData: 'leftFolderFile4', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const link1: Link = await root.links.add({from: leftFolderFile1, to: rightFolderTopFile, save: true})
	const link2: Link = await root.links.add({from: leftFolderFile2, to: rightFolderTopFile, save: true})
	const link3: Link = await root.links.add({from: leftFolderFile3, to: rightFolderBottomFile, save: true})
	const link4: Link = await root.links.add({from: leftFolderFile4, to: rightFolderBottomFile, save: true})

	await linkBundler.bundleLink(link1)
	await linkBundler.bundleLink(link3)

	expect(BoxLinks.findLinkRoute(leftFolderFile1, rightFolderTopFile)?.at(1)?.getId()).toBe(link2.getId())
	expect(BoxLinks.findLinkRoute(leftFolderFile3, rightFolderBottomFile)?.at(1)?.getId()).toBe(link4.getId())

	await linkBundler.bundleLink(link2)

	const route1: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile1, rightFolderTopFile)
	const route2: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile2, rightFolderTopFile)
	const route3: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile3, rightFolderBottomFile)
	const route4: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile4, rightFolderBottomFile)
	expect(route1?.map(link => link.getId())).toEqual([link1.getId(), link4.getId(), expect.anything()])
	expect(route2?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), link2.getId()])
	expect(route3?.map(link => link.getId())).toEqual([link3.getId(), link4.getId(), expect.anything()])
	expect(route4?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), expect.anything()])
	expect(route1?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route1?.at(2)?.getId()], [], [route2?.at(0)?.getId(), link1.getId()]])
	expect(route2?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route2?.at(2)?.getId()], [], [route2?.at(0)?.getId(), link1.getId()]])
	expect(route3?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route3?.at(2)?.getId()], [], [route4?.at(0)?.getId(), link3.getId()]])
	expect(route4?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route4?.at(2)?.getId()], [], [route4?.at(0)?.getId(), link3.getId()]])
})

test('bundleLink, knots on to side need to be merged', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderFile1 = boxFactory.fileOf({idOrData: 'leftFolderFile1', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderFile2 = boxFactory.fileOf({idOrData: 'leftFolderFile2', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderFile3 = boxFactory.fileOf({idOrData: 'leftFolderFile3', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderFile4 = boxFactory.fileOf({idOrData: 'leftFolderFile4', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const link1: Link = await root.links.add({from: rightFolderTopFile, to: leftFolderFile1, save: true})
	const link2: Link = await root.links.add({from: rightFolderTopFile, to: leftFolderFile2, save: true})
	const link3: Link = await root.links.add({from: rightFolderBottomFile, to: leftFolderFile3, save: true})
	const link4: Link = await root.links.add({from: rightFolderBottomFile, to: leftFolderFile4, save: true})

	await linkBundler.bundleLink(link1)
	await linkBundler.bundleLink(link3)

	expect(BoxLinks.findLinkRoute(rightFolderTopFile, leftFolderFile1)?.at(0)?.getId()).toBe(link2.getId())
	expect(BoxLinks.findLinkRoute(rightFolderBottomFile, leftFolderFile3)?.at(0)?.getId()).toBe(link4.getId())

	await linkBundler.bundleLink(link2)

	const route1: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderTopFile, leftFolderFile1)
	const route2: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderTopFile, leftFolderFile2)
	const route3: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderBottomFile, leftFolderFile3)
	const route4: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderBottomFile, leftFolderFile4)
	expect(route1?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), link1.getId()])
	expect(route2?.map(link => link.getId())).toEqual([link2.getId(), link4.getId(), expect.anything()])
	expect(route3?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), link3.getId()])
	expect(route4?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), expect.anything()])
	expect(route1?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route2?.at(2)?.getId(), link1.getId()], [], [link2.getId()]])
	expect(route2?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route2?.at(2)?.getId(), link1.getId()], [], [link2.getId()]])
	expect(route3?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route4?.at(2)?.getId(), link3.getId()], [], [route4?.at(0)?.getId()]])
	expect(route4?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route4?.at(2)?.getId(), link3.getId()], [], [route4?.at(0)?.getId()]])
})

test('bundleLink, knots on both sides need to be merged', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderFile1 = boxFactory.fileOf({idOrData: 'leftFolderFile1', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderFile2 = boxFactory.fileOf({idOrData: 'leftFolderFile2', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderFile3 = boxFactory.fileOf({idOrData: 'leftFolderFile3', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderFile4 = boxFactory.fileOf({idOrData: 'leftFolderFile4', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderFile1 = boxFactory.fileOf({idOrData: 'rightFolderFile1', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderFile2 = boxFactory.fileOf({idOrData: 'rightFolderFile2', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderFile3 = boxFactory.fileOf({idOrData: 'rightFolderFile3', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderFile4 = boxFactory.fileOf({idOrData: 'rightFolderFile4', parent: rightFolder, addToParent: true, rendered: true})

	const link1: Link = await root.links.add({from: leftFolderFile1, to: rightFolderFile1, save: true})
	const link2: Link = await root.links.add({from: leftFolderFile2, to: rightFolderFile2, save: true})
	await linkBundler.bundleLink(link1)
	
	const link3: Link = await root.links.add({from: leftFolderFile3, to: rightFolderFile3, save: true})
	const link4: Link = await root.links.add({from: leftFolderFile4, to: rightFolderFile3, save: true})
	await linkBundler.bundleLink(link3)

	expect(BoxLinks.findLinkRoute(leftFolderFile1, rightFolderFile1)?.at(1)?.getId()).toBe(link2.getId())
	expect(BoxLinks.findLinkRoute(leftFolderFile3, rightFolderFile3)?.at(1)?.getId()).toBe(link4.getId())
	
	const link5: Link = await root.links.add({from: leftFolderFile4, to: rightFolderFile4, save: true})
	await linkBundler.bundleLink(link5)
	const temporaryRoute3: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile3, rightFolderFile3)
	const temporaryRoute4: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile4, rightFolderFile3)
	const temporaryRoute5: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile4, rightFolderFile4)
	expect(temporaryRoute3?.map(link => link.getId())).toEqual([link3.getId(), link4.getId(), expect.anything()])
	expect(temporaryRoute4?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), expect.anything()])
	expect(temporaryRoute5?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), link5.getId()])
	//expect(BoxLinks.findLinkRoute(leftFolderFile3, rightFolderFile4)?.map(link => link.getId())).toBe(undefined) TODO should not find route between these files
	expect(temporaryRoute3?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([
		[temporaryRoute3?.at(2)?.getId()], [], [temporaryRoute4?.at(0)?.getId(), link3.getId()]
	])
	expect(temporaryRoute4?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([
		[temporaryRoute4?.at(2)?.getId(), link5.getId()], [], [temporaryRoute4?.at(0)?.getId(), link3.getId()]
	])
	expect(temporaryRoute5?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([
		[temporaryRoute4?.at(2)?.getId(), link5.getId()], [], [temporaryRoute4?.at(0)?.getId()]
	])
})