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

	const bottomLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFile)!
	expect(bottomLinkRoute.length).toBe(2)
	expect(bottomLinkRoute[1].getId()).toBe(bottomLink.getId())
	
	expect(topLink.getData().from.path.map(waypoint => waypoint.boxId)).toEqual(['leftFolderTopFile'])
	expect(topLink.getData().to.path.map(waypoint => waypoint.boxId)).toEqual([expect.stringContaining('node')])
	//expect(topLink.getData().to.path.map(waypoint => waypoint.boxId)).toEqual(expect.arrayContaining(['rightFile', expect.anything()]))
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

	const bottomLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)!
	expect(bottomLinkRoute.length).toBe(3)
	expect(bottomLinkRoute[1].getId()).toBe(bottomLink.getId())
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

	const shortRoute: Link[] = BoxLinks.findLinkRoute(leftInnerFolder, root)!
	expect(shortRoute.length).toBe(3)
	expect(shortRoute[2].getId()).toBe(shortLink.getId())

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

	const shortRoute: Link[] = BoxLinks.findLinkRoute(root, leftInnerFolder)!
	expect(shortRoute.length).toBe(3)
	expect(shortRoute[0].getId()).toBe(shortLink.getId())

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
	expect(linkRouteFromLeftFolderFile).toEqual(linkRoute)
	const linkRouteFromLeftFolder: Link[]|undefined = BoxLinks.findLinkRoute(leftFolder, rightFile)
	expect(linkRouteFromLeftFolder?.length).toBe(2)
	expect(linkRouteFromLeftFolder?.at(0)).toBe(link)
	expect(linkRouteFromLeftFolder?.at(1)).toBe(linkRoute.at(1))
	expect(linkRouteFromLeftFolder?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('leftFolder')
	expect(linkRouteFromLeftFolder?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromLeftFolder?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromLeftFolder?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('rightFile')

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
	expect(linkRouteToLeftFolderFile).toEqual(linkRoute)
	const linkRouteToLeftFolder: Link[]|undefined = BoxLinks.findLinkRoute(rightFile, leftFolder)
	expect(linkRouteToLeftFolder?.length).toBe(2)
	expect(linkRouteToLeftFolder?.at(0)).toBe(linkRoute.at(0))
	expect(linkRouteToLeftFolder?.at(1)).toBe(link)
	expect(linkRouteToLeftFolder?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('rightFile')
	expect(linkRouteToLeftFolder?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToLeftFolder?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToLeftFolder?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('leftFolder')

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
	expect(linkRouteToRightFile).toEqual(linkRoute)
	const linkRouteToRoot: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile, root)
	expect(linkRouteToRoot?.length).toBe(2)
	expect(linkRouteToRoot?.at(0)).toBe(linkRoute.at(0))
	expect(linkRouteToRoot?.at(1)).toBe(link)
	expect(linkRouteToRoot?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderFile')
	expect(linkRouteToRoot?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToRoot?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToRoot?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('root')

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
	expect(linkRouteFromRightFile).toEqual(linkRoute)
	const linkRouteFromRoot: Link[]|undefined = BoxLinks.findLinkRoute(root, leftFolderFile)
	expect(linkRouteFromRoot?.length).toBe(2)
	expect(linkRouteFromRoot?.at(0)).toBe(link)
	expect(linkRouteFromRoot?.at(1)).toBe(linkRoute.at(1))
	expect(linkRouteFromRoot?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('root')
	expect(linkRouteFromRoot?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromRoot?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromRoot?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderFile')

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
 
	expect(BoxLinks.findLinkRoute(file, rootKnot)?.map(node => node.getId())).toEqual([linkToRootKnot, linkBetweenKnots].map(node => node.getId()))

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
 
	expect(BoxLinks.findLinkRoute(rootKnot, file)?.map(node => node.getId())).toEqual([linkBetweenKnots, linkFromRootKnot].map(node => node.getId()))

	HoverManager.removeHoverable(rootKnot)
	HoverManager.removeHoverable(fileKnot)
})
