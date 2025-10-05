//import * as testUtil from '../../test/testUtil' // would result in other modules as they would be loaded from 'src' and not from 'dist'
import * as testUtil from './testUtil/testUtil'
//import * as boxFactory from '../../test/core/box/factories/boxFactory' // would result in other modules as they would be loaded from 'src' and not from 'dist'
import * as boxFactory from './testUtil/boxFactory'
import * as linkBundler from './bundler'
import { BoxLinks } from '../../src/core/box/BoxLinks'
import { Link } from '../../src/core/link/Link'
import { NodeData } from '../../src/core/mapData/NodeData'
import { NodeWidget } from '../../src/core/node/NodeWidget'
import { HoverManager } from '../../src/core/HoverManager'
import { BoxData } from '../../src/core/mapData/BoxData'
import { HighlightPropagatingLink } from './HighlightPropagatingLink'

test('bundleLink, nothing to bundle', async () => {
	await testUtil.initServicesWithMocks()

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const fileA = boxFactory.fileOf({idOrData: 'fileA', parent: root, addToParent: true, rendered: true})
	const fileB = boxFactory.fileOf({idOrData: 'fileB', parent: root, addToParent: true, rendered: true})
	const link = await root.links.add({from: fileA, to: fileB, save: true})

	await linkBundler.bundleLink(link, {entangleLinks: true})

	expect(link.getData().from.path.map(waypoint => waypoint.boxId)).toEqual(['fileA'])
	expect(link.getData().to.path.map(waypoint => waypoint.boxId)).toEqual(['fileB'])
})

test('bundleLink, insert one node', async () => {
	await testBundleLinkInsertOneNode({toBoxHasOutgoingLinks: false})
})

test('bundleLink, insert one node, to box has outgoing links', async () => {
	await testBundleLinkInsertOneNode({toBoxHasOutgoingLinks: true})
})

async function testBundleLinkInsertOneNode(options: {toBoxHasOutgoingLinks: boolean}): Promise<void> {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const rightFile = boxFactory.fileOf({idOrData: new BoxData('rootFolderFile', 60, 40, 20, 20, [], []), parent: root, addToParent: true, rendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 40, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	
	const topLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFile, save: true})
	const bottomLink: Link = await root.links.add({from: leftFolderBottomFile, to: rightFile, save: true})
	const toBoxOutgoingLinks: Link[]|undefined = options.toBoxHasOutgoingLinks
		? [await root.links.add({from: rightFile, to: root, save: true}), await root.links.add({from: rightFile, to: root, save: true})]
		: undefined
	
	await linkBundler.bundleLink(topLink, {entangleLinks: true})
	await verifyEndResult(bottomLink)

	await testBundleDuplicateLink('bundleDuplicateLink')

	await testBundleDuplicateLink('bundleIntoDuplicateLink')

	async function testBundleDuplicateLink(mode: 'bundleDuplicateLink'|'bundleIntoDuplicateLink'): Promise<void> {
		const duplicateLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFile, save: true})
		expect(leftFolderTopFile.borderingLinks.getAll().length).toBe(2)
		expect(rightFile.borderingLinks.getAll().length).toBe(2 + (toBoxOutgoingLinks?.length?? 0))
	
		const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation()
		try {
			await linkBundler.bundleLink(mode === 'bundleDuplicateLink' ? duplicateLink : bottomLink, {entangleLinks: true})
		
			await verifyEndResult(mode === 'bundleDuplicateLink' ? bottomLink : duplicateLink)
			expect(leftFolderTopFile.borderingLinks.getAll().length).toBe(1)
			expect(rightFile.borderingLinks.getAll().length).toBe(1 + (toBoxOutgoingLinks?.length?? 0))
			const warnCalls: string[] = consoleWarnMock.mock.calls.map(call => call.join())
			expect(warnCalls.length).toBe(1)
			expect(warnCalls[0].startsWith(`linkBundler.ensureNoRedundantRouteIds(from: 'leftFolderTopFileName', to: 'rootFolderFileName', ..) detected redundant routeIds [${HighlightPropagatingLink.getRouteIds(topLink)}`)).toBe(true)
			expect(warnCalls[0].endsWith(`], removing them except '${HighlightPropagatingLink.getRouteIds(topLink)[0]}'`)).toBe(true)
		} finally {
			consoleWarnMock.mockRestore()
		}
	}

	async function verifyEndResult(expectedRootLink: Link): Promise<void> {
		const topLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderTopFile, rightFile)!
		expect(topLinkRoute.length).toBe(2)
		expect(topLinkRoute[0].getId()).toBe(topLink.getId())
		expect(topLinkRoute[1].getId()).toBe(expectedRootLink.getId())
		expect(HighlightPropagatingLink.getRouteIds(topLinkRoute[0]).length).toBe(1)
		expect(HighlightPropagatingLink.getRouteIds(topLinkRoute[1]).length).toBe(2)
		expect(HighlightPropagatingLink.getRouteIds(topLinkRoute[1]).includes(HighlightPropagatingLink.getRouteIds(topLinkRoute[0])[0]))
		expect(topLinkRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])
		
		const bottomLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFile)!
		expect(bottomLinkRoute.length).toBe(2)
		expect(bottomLinkRoute[1].getId()).toBe(expectedRootLink.getId())
		expect(HighlightPropagatingLink.getRouteIds(bottomLinkRoute[0]).length).toBe(1)
		expect(HighlightPropagatingLink.getRouteIds(bottomLinkRoute[1]).length).toBe(2)
		expect(HighlightPropagatingLink.getRouteIds(bottomLinkRoute[1]).includes(HighlightPropagatingLink.getRouteIds(bottomLinkRoute[0])[0]))
		expect(bottomLinkRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])
		
		expect(topLinkRoute[1].getId()).toBe(bottomLinkRoute[1].getId())
		expect(topLink.getData().from.path.map(waypoint => waypoint.boxId)).toEqual(['leftFolderTopFile'])
		expect(topLink.getData().to.path.map(waypoint => waypoint.boxId)).toEqual([expect.stringContaining('node')])
		if (toBoxOutgoingLinks) {
			expect(toBoxOutgoingLinks.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])
		}
	}
}

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

	await linkBundler.bundleLink(topLink, {entangleLinks: true})
	await verifyEndResult(bottomLink)

	await testBundleDuplicateLink('bundleDuplicateLink')

	await testBundleDuplicateLink('bundleIntoDuplicateLink')

	async function testBundleDuplicateLink(mode: 'bundleDuplicateLink'|'bundleIntoDuplicateLink'): Promise<void> {
		const duplicateLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFolderTopFile, save: true})
		expect(leftFolderTopFile.borderingLinks.getAll().length).toBe(2)
		expect(rightFolderTopFile.borderingLinks.getAll().length).toBe(2)
	
		const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation()
		try {
			await linkBundler.bundleLink(mode === 'bundleDuplicateLink' ? duplicateLink : bottomLink, {entangleLinks: true})
		
			await verifyEndResult(mode === 'bundleDuplicateLink' ? bottomLink : duplicateLink)
			expect(leftFolderTopFile.borderingLinks.getAll().length).toBe(1)
			expect(rightFolderTopFile.borderingLinks.getAll().length).toBe(1)
			const warnCalls: string[] = consoleWarnMock.mock.calls.map(call => call.join())
			expect(warnCalls.length).toBe(1)
			expect(warnCalls[0].startsWith(`linkBundler.ensureNoRedundantRouteIds(from: 'leftFolderTopFileName', to: 'rightFolderTopFileName', ..) detected redundant routeIds [${HighlightPropagatingLink.getRouteIds(topLink)}`)).toBe(true)
			expect(warnCalls[0].endsWith(`], removing them except '${HighlightPropagatingLink.getRouteIds(topLink)}'`)).toBe(true)
		} finally {
			consoleWarnMock.mockRestore()
		}
	}

	async function verifyEndResult(expectedRootLink: Link): Promise<void> {
		const topLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)!
		expect(topLinkRoute.length).toBe(3)
		expect(topLinkRoute[0].getId()).toBe(topLink.getId())
		expect(topLinkRoute[1].getId()).toBe(expectedRootLink.getId())
		expect(HighlightPropagatingLink.getRouteIds(topLinkRoute[0]).length).toBe(1)
		const topRouteId: string = HighlightPropagatingLink.getRouteIds(topLinkRoute[0])[0]
		expect(HighlightPropagatingLink.getRouteIds(topLinkRoute[1]).length).toBe(2)
		expect(HighlightPropagatingLink.getRouteIds(topLinkRoute[1])).toContain(topRouteId)
		expect(HighlightPropagatingLink.getRouteIds(topLinkRoute[2]).length).toBe(1)
		expect(HighlightPropagatingLink.getRouteIds(topLinkRoute[2])).toContain(topRouteId)
		expect(topLinkRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [topLink.getId()]])

		const bottomLinkRoute: Link[] = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)!
		expect(bottomLinkRoute.length).toBe(3)
		expect(bottomLinkRoute[1].getId()).toBe(expectedRootLink.getId())
		expect(HighlightPropagatingLink.getRouteIds(bottomLinkRoute[0]).length).toBe(1)
		const bottomRouteId: string = HighlightPropagatingLink.getRouteIds(bottomLinkRoute[0])[0]
		expect(HighlightPropagatingLink.getRouteIds(bottomLinkRoute[1]).length).toBe(2)
		expect(HighlightPropagatingLink.getRouteIds(bottomLinkRoute[1])).toContain(bottomRouteId)
		expect(HighlightPropagatingLink.getRouteIds(bottomLinkRoute[2]).length).toBe(1)
		expect(HighlightPropagatingLink.getRouteIds(bottomLinkRoute[2])).toContain(bottomRouteId)
		expect(bottomLinkRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [expect.anything()]])
	}
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

	await linkBundler.bundleLink({longLink, shortLink}[linkToBundle], {entangleLinks: true})
	
	const longRoute: Link[] = BoxLinks.findLinkRoute(leftFile, rightFile)!
	expect(longRoute.length).toBe(3)
	expect(longRoute[2].getId()).toBe(longLink.getId())
	expect(HighlightPropagatingLink.getRouteIds(longRoute[0]).length).toBe(1)
	const longRouteId: string = HighlightPropagatingLink.getRouteIds(longRoute[0])[0]
	expect(HighlightPropagatingLink.getRouteIds(longRoute[1]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(longRoute[1])).toContain(longRouteId)
	expect(HighlightPropagatingLink.getRouteIds(longRoute[2]).length).toBe(1)
	expect(HighlightPropagatingLink.getRouteIds(longRoute[2])).toContain(longRouteId)
	expect(longRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[longLink.getId()], [], [expect.anything()]])

	const shortRoute: Link[] = BoxLinks.findLinkRoute(leftInnerFolder, root)!
	expect(shortRoute.length).toBe(3)
	expect(shortRoute[2].getId()).toBe(shortLink.getId())
	expect(HighlightPropagatingLink.getRouteIds(shortRoute[0]).length).toBe(1)
	const shortRouteId: string = HighlightPropagatingLink.getRouteIds(shortRoute[0])[0]
	expect(HighlightPropagatingLink.getRouteIds(shortRoute[1]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(shortRoute[1])).toContain(shortRouteId)
	expect(HighlightPropagatingLink.getRouteIds(shortRoute[2]).length).toBe(1)
	expect(HighlightPropagatingLink.getRouteIds(shortRoute[2])).toContain(shortRouteId)
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

	await linkBundler.bundleLink({longLink, shortLink}[linkToBundle], {entangleLinks: true})
	
	const longRoute: Link[] = BoxLinks.findLinkRoute(rightFile, leftFile)!
	expect(longRoute.length).toBe(3)
	expect(longRoute[0].getId()).toBe(longLink.getId())
	expect(HighlightPropagatingLink.getRouteIds(longRoute[0]).length).toBe(1)
	const longRouteId: string = HighlightPropagatingLink.getRouteIds(longRoute[0])[0]
	expect(HighlightPropagatingLink.getRouteIds(longRoute[1]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(longRoute[1])).toContain(longRouteId)
	expect(HighlightPropagatingLink.getRouteIds(longRoute[2]).length).toBe(1)
	expect(HighlightPropagatingLink.getRouteIds(longRoute[2])).toContain(longRouteId)
	expect(longRoute.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [longLink.getId()]])

	const shortRoute: Link[] = BoxLinks.findLinkRoute(root, leftInnerFolder)!
	expect(shortRoute.length).toBe(3)
	expect(shortRoute[0].getId()).toBe(shortLink.getId())
	expect(HighlightPropagatingLink.getRouteIds(shortRoute[0]).length).toBe(1)
	const shortRouteId: string = HighlightPropagatingLink.getRouteIds(shortRoute[0])[0]
	expect(HighlightPropagatingLink.getRouteIds(shortRoute[1]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(shortRoute[1])).toContain(shortRouteId)
	expect(HighlightPropagatingLink.getRouteIds(shortRoute[2]).length).toBe(1)
	expect(HighlightPropagatingLink.getRouteIds(shortRoute[2])).toContain(shortRouteId)
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

	await linkBundler.bundleLink(link, {entangleLinks: true})
	
	const linkRouteFromLeftFolderFile: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile, rightFile)
	expect(linkRouteFromLeftFolderFile?.map(link => link.getId())).toEqual(linkRoute.map(link => link.getId()))
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromLeftFolderFile![0]).length).toBe(1)
	const fileRouteId: string = HighlightPropagatingLink.getRouteIds(linkRouteFromLeftFolderFile![0])[0]
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromLeftFolderFile![1]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromLeftFolderFile![1])).toContain(fileRouteId)
	const linkRouteFromLeftFolder: Link[]|undefined = BoxLinks.findLinkRoute(leftFolder, rightFile)
	expect(linkRouteFromLeftFolder?.length).toBe(2)
	expect(linkRouteFromLeftFolder?.at(0)).toBe(link)
	expect(linkRouteFromLeftFolder?.at(1)).toBe(linkRoute.at(1))
	expect(linkRouteFromLeftFolder?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('leftFolder')
	expect(linkRouteFromLeftFolder?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromLeftFolder?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromLeftFolder?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('rightFile')
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromLeftFolderFile![0]).length).toBe(1)
	const folderRouteId: string = HighlightPropagatingLink.getRouteIds(linkRouteFromLeftFolder![0])[0]
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromLeftFolder![1]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromLeftFolder![1])).toContain(folderRouteId)
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

	await linkBundler.bundleLink(link, {entangleLinks: true})
	
	const linkRouteToLeftFolderFile: Link[]|undefined = BoxLinks.findLinkRoute(rightFile, leftFolderFile)
	expect(linkRouteToLeftFolderFile?.map(link => link.getId())).toEqual(linkRoute.map(link => link.getId()))
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToLeftFolderFile![1]).length).toBe(1)
	const fileRouteId: string = HighlightPropagatingLink.getRouteIds(linkRouteToLeftFolderFile![1])[0]
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToLeftFolderFile![0]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToLeftFolderFile![0])).toContain(fileRouteId)
	const linkRouteToLeftFolder: Link[]|undefined = BoxLinks.findLinkRoute(rightFile, leftFolder)
	expect(linkRouteToLeftFolder?.length).toBe(2)
	expect(linkRouteToLeftFolder?.at(0)).toBe(linkRoute.at(0))
	expect(linkRouteToLeftFolder?.at(1)).toBe(link)
	expect(linkRouteToLeftFolder?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('rightFile')
	expect(linkRouteToLeftFolder?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToLeftFolder?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToLeftFolder?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('leftFolder')
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToLeftFolder![1]).length).toBe(1)
	const folderRouteId: string = HighlightPropagatingLink.getRouteIds(linkRouteToLeftFolder![1])[0]
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToLeftFolder![0]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToLeftFolder![0])).toContain(folderRouteId)
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

	await linkBundler.bundleLink(link, {entangleLinks: true})
	
	const linkRouteToRightFile: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile, rightFile)
	expect(linkRouteToRightFile?.map(link => link.getId())).toEqual(linkRoute.map(link => link.getId()))
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToRightFile![1]).length).toBe(1)
	const fileRouteId: string = HighlightPropagatingLink.getRouteIds(linkRouteToRightFile![1])[0]
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToRightFile![0]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToRightFile![0])).toContain(fileRouteId)
	const linkRouteToRoot: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile, root)
	expect(linkRouteToRoot?.length).toBe(2)
	expect(linkRouteToRoot?.at(0)).toBe(linkRoute.at(0))
	expect(linkRouteToRoot?.at(1)).toBe(link)
	expect(linkRouteToRoot?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderFile')
	expect(linkRouteToRoot?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToRoot?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteToRoot?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('root')
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToRoot![1]).length).toBe(1)
	const rootRouteId: string = HighlightPropagatingLink.getRouteIds(linkRouteToRoot![1])[0]
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToRoot![0]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(linkRouteToRoot![0])).toContain(rootRouteId)
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

	await linkBundler.bundleLink(link, {entangleLinks: true})
	
	const linkRouteFromRightFile: Link[]|undefined = BoxLinks.findLinkRoute(rightFile, leftFolderFile)
	expect(linkRouteFromRightFile?.map(link => link.getId())).toEqual(linkRoute.map(link => link.getId()))
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromRightFile![0]).length).toBe(1)
	const fileRouteId: string = HighlightPropagatingLink.getRouteIds(linkRouteFromRightFile![0])[0]
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromRightFile![1]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromRightFile![1])).toContain(fileRouteId)
	const linkRouteFromRoot: Link[]|undefined = BoxLinks.findLinkRoute(root, leftFolderFile)
	expect(linkRouteFromRoot?.length).toBe(2)
	expect(linkRouteFromRoot?.at(0)).toBe(link)
	expect(linkRouteFromRoot?.at(1)).toBe(linkRoute.at(1))
	expect(linkRouteFromRoot?.at(0)?.getData().from.path.at(-1)?.boxId).toBe('root')
	expect(linkRouteFromRoot?.at(0)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromRoot?.at(1)?.getData().from.path.at(-1)?.boxId).toBe('leftFolderKnot')
	expect(linkRouteFromRoot?.at(1)?.getData().to.path.at(-1)?.boxId).toBe('leftFolderFile')
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromRoot![0]).length).toBe(1)
	const rootRouteId: string = HighlightPropagatingLink.getRouteIds(linkRouteFromRoot![0])[0]
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromRoot![1]).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(linkRouteFromRoot![1])).toContain(rootRouteId)
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

	await linkBundler.bundleLink(linkToRootKnot, {entangleLinks: true})

	const linkRouteToRootKnot: Link[]|undefined = BoxLinks.findLinkRoute(file, rootKnot)
	expect(linkRouteToRootKnot?.map(link => link.getId())).toEqual([linkToRootKnot, linkBetweenKnots].map(link => link.getId()))
	expect(HighlightPropagatingLink.getRouteIds(linkToRootKnot).length).toBe(1)
	const fileRouteId: string = HighlightPropagatingLink.getRouteIds(linkToRootKnot)[0]
	expect(HighlightPropagatingLink.getRouteIds(linkBetweenKnots).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(linkBetweenKnots)).toContain(fileRouteId)
	// TODO: or: ?
	//expect(HighlightPropagatingLink.getRouteIds(linkRouteToRootKnot![0]).length).toBe(0)
	//expect(HighlightPropagatingLink.getRouteIds(linkRouteToRootKnot![1]).length).toBe(0)
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

	await linkBundler.bundleLink(linkFromRootKnot, {entangleLinks: true})

	const linkRouteFromRootKnot: Link[]|undefined = BoxLinks.findLinkRoute(rootKnot, file)
	expect(linkRouteFromRootKnot?.map(node => node.getId())).toEqual([linkBetweenKnots, linkFromRootKnot].map(node => node.getId()))
	expect(HighlightPropagatingLink.getRouteIds(linkFromRootKnot).length).toBe(1)
	const fileRouteId: string = HighlightPropagatingLink.getRouteIds(linkFromRootKnot)[0]
	expect(HighlightPropagatingLink.getRouteIds(linkBetweenKnots).length).toBe(2)
	expect(HighlightPropagatingLink.getRouteIds(linkBetweenKnots)).toContain(fileRouteId)
	// TODO: or: ?
	//expect(HighlightPropagatingLink.getRouteIds(linkRouteFromRootKnot![0]).length).toBe(0)
	//expect(HighlightPropagatingLink.getRouteIds(linkRouteFromRootKnot![1]).length).toBe(0)
	expect(linkRouteFromRootKnot?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])

	HoverManager.removeHoverable(rootKnot)
	HoverManager.removeHoverable(fileKnot)
})

/*test('bundleLink, too short to bundle', async () => { // TODO this test should succeed
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderKnot: NodeWidget = await leftFolder.nodes.add(new NodeData('leftFolderKnot', 100, 50))
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const topToKnot: Link = await leftFolder.links.add({from: leftFolderTopFile, to: leftFolderKnot, save: true})
	const bottomToKnot: Link = await leftFolder.links.add({from: leftFolderBottomFile, to: leftFolderKnot, save: true})
	const knotToRightTopFile: Link = await root.links.add({from: leftFolderKnot, to: rightFolderTopFile, save: true})
	const topToRoot: Link = await root.links.add({from: leftFolderTopFile, to: root, save: true})

	await linkBundler.bundleLink(topToRoot, {entangleLinks: true})

	const topToRightRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)
	const bottomToRightRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderTopFile)
	const topToRootRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, root)
	expect(topToRightRoute?.map(node => node.getId())).toEqual([topToKnot.getId(), knotToRightTopFile.getId()])
	expect(bottomToRightRoute?.map(node => node.getId())).toEqual([bottomToKnot.getId(), knotToRightTopFile.getId()])
	expect(topToRootRoute?.map(node => node.getId())).toEqual([topToRoot.getId()])
	expect(topToRightRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])
	expect(bottomToRightRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], []])
	expect(topToRootRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[]])

	HoverManager.removeHoverable(leftFolderKnot)
})*/

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
	HighlightPropagatingLink.addRoute(topToKnot, 'topToTop')
	const bottomToKnot: Link = await leftFolder.links.add({from: leftFolderBottomFile, to: leftFolderKnot, save: true})
	HighlightPropagatingLink.addRoute(bottomToKnot, 'bottomToTop')
	const knotToRightTopFile: Link = await root.links.add({from: leftFolderKnot, to: rightFolderTopFile, save: true})
	HighlightPropagatingLink.addRoutes(knotToRightTopFile, ['topToTop', 'bottomToTop'])
	const topToOtherKnot: Link = await leftFolder.links.add({from: leftFolderTopFile, to: otherLeftFolderKnot, save: true})
	HighlightPropagatingLink.addRoute(topToOtherKnot, 'topToBottom')
	const bottomToOtherKnot: Link = await leftFolder.links.add({from: leftFolderBottomFile, to: otherLeftFolderKnot, save: true})
	HighlightPropagatingLink.addRoute(bottomToOtherKnot, 'bottomToBottom')
	const otherKnotToRightBottomFile: Link = await root.links.add({from: otherLeftFolderKnot, to: rightFolderBottomFile, save: true})
	HighlightPropagatingLink.addRoutes(otherKnotToRightBottomFile, ['topToBottom', 'bottomToBottom'])
	
	await linkBundler.bundleLink(otherKnotToRightBottomFile, {entangleLinks: true})

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
	const linkToTop: Link = linkRouteFromTopToTop?.at(2)!
	expect(linkRouteFromBottomToTop?.at(2)?.getId()).toBe(linkToTop.getId())
	const linkToBottom: Link = otherKnotToRightBottomFile
	expect(HighlightPropagatingLink.getRouteIds(topToKnot)).toEqual(['topToTop', 'topToBottom'])
	expect(HighlightPropagatingLink.getRouteIds(bottomToKnot)).toEqual(['bottomToTop', 'bottomToBottom'])
	expect(HighlightPropagatingLink.getRouteIds(knotToRightTopFile)).toEqual(['topToTop', 'bottomToTop', 'topToBottom', 'bottomToBottom'])
	expect(HighlightPropagatingLink.getRouteIds(linkToTop)).toEqual(['topToTop', 'bottomToTop'])
	expect(HighlightPropagatingLink.getRouteIds(linkToBottom)).toEqual(['topToBottom', 'bottomToBottom'])
	expect(linkRouteFromTopToTop?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[linkToTop.getId(), linkToBottom.getId()], [], [topToKnot.getId(), bottomToKnot.getId()]])
	expect(linkRouteFromTopToBottom?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[linkToTop.getId(), linkToBottom.getId()], [], [topToKnot.getId(), bottomToKnot.getId()]])
	expect(linkRouteFromBottomToTop?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[linkToTop.getId(), linkToBottom.getId()], [], [topToKnot.getId(), bottomToKnot.getId()]])
	expect(linkRouteFromBottomToBottom?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[linkToTop.getId(), linkToBottom.getId()], [], [topToKnot.getId(), bottomToKnot.getId()]])

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
	HighlightPropagatingLink.addRoutes(rightTopFileToKnot, ['topToTop', 'topToBottom'])
	const knotToTop: Link = await leftFolder.links.add({from: leftFolderKnot, to: leftFolderTopFile, save: true})
	HighlightPropagatingLink.addRoute(knotToTop, 'topToTop')
	const knotToBottom: Link = await leftFolder.links.add({from: leftFolderKnot, to: leftFolderBottomFile, save: true})
	HighlightPropagatingLink.addRoute(knotToBottom, 'topToBottom')
	const rightBottomFileToOtherKnot: Link = await root.links.add({from: rightFolderBottomFile, to: otherLeftFolderKnot, save: true})
	HighlightPropagatingLink.addRoutes(rightBottomFileToOtherKnot, ['bottomToTop', 'bottomToBottom'])
	const otherKnotToTop: Link = await leftFolder.links.add({from: otherLeftFolderKnot, to: leftFolderTopFile, save: true})
	HighlightPropagatingLink.addRoute(otherKnotToTop, 'bottomToTop')
	const otherKnotToBottom: Link = await leftFolder.links.add({from: otherLeftFolderKnot, to: leftFolderBottomFile, save: true})
	HighlightPropagatingLink.addRoute(otherKnotToBottom, 'bottomToBottom')
	
	await linkBundler.bundleLink(rightBottomFileToOtherKnot, {entangleLinks: true})

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
	const linkFromTop: Link = linkRouteFromTopToTop?.at(0)!
	expect(linkRouteFromTopToBottom?.at(0)?.getId()).toBe(linkFromTop.getId())
	const linkFromBottom: Link = rightBottomFileToOtherKnot
	expect(HighlightPropagatingLink.getRouteIds(linkFromTop)).toEqual(['topToTop', 'topToBottom'])
	expect(HighlightPropagatingLink.getRouteIds(linkFromBottom)).toEqual(['bottomToTop', 'bottomToBottom'])
	expect(HighlightPropagatingLink.getRouteIds(rightTopFileToKnot)).toEqual(['topToTop', 'topToBottom', 'bottomToTop', 'bottomToBottom'])
	expect(HighlightPropagatingLink.getRouteIds(knotToTop)).toEqual(['topToTop', 'bottomToTop'])
	expect(HighlightPropagatingLink.getRouteIds(knotToBottom)).toEqual(['topToBottom', 'bottomToBottom'])
	expect(linkRouteFromTopToTop?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[knotToTop.getId(), knotToBottom.getId()], [], [linkFromTop.getId(), linkFromBottom.getId()]])
	expect(linkRouteFromTopToBottom?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[knotToTop.getId(), knotToBottom.getId()], [], [linkFromTop.getId(), linkFromBottom.getId()]])
	expect(linkRouteFromBottomToTop?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[knotToTop.getId(), knotToBottom.getId()], [], [linkFromTop.getId(), linkFromBottom.getId()]])
	expect(linkRouteFromBottomToBottom?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[knotToTop.getId(), knotToBottom.getId()], [], [linkFromTop.getId(), linkFromBottom.getId()]])

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
	HighlightPropagatingLink.addRoutes(leftToRightFolderKnot, ['toTop', 'toMid'])
	const rightFolderKnotToTopFile: Link = await rightFolder.links.add({from: rightFolderKnot, to: rightFolderTopFile, save: true})
	HighlightPropagatingLink.addRoute(rightFolderKnotToTopFile, 'toTop')
	const rightFolderKnotToMidFile: Link = await rightFolder.links.add({from: rightFolderKnot, to: rightFolderMidFile, save: true})
	HighlightPropagatingLink.addRoute(rightFolderKnotToMidFile, 'toMid')
	const leftToRightFolderBottomFile: Link = await root.links.add({from: leftFile, to: rightFolderBottomFile, save: true})

	await linkBundler.bundleLink(leftToRightFolderKnot, {entangleLinks: true})

	const routeToTopFile: Link[]|undefined = BoxLinks.findLinkRoute(leftFile, rightFolderTopFile)
	const routeToMidFile: Link[]|undefined = BoxLinks.findLinkRoute(leftFile, rightFolderMidFile)
	const routeToBottomFile: Link[]|undefined = BoxLinks.findLinkRoute(leftFile, rightFolderBottomFile)
	expect(routeToTopFile?.map(node => node.getId())).toEqual([leftToRightFolderBottomFile.getId(), rightFolderKnotToTopFile.getId()])
	expect(routeToMidFile?.map(node => node.getId())).toEqual([leftToRightFolderBottomFile.getId(), rightFolderKnotToMidFile.getId()])
	expect(routeToBottomFile?.map(node => node.getId())).toEqual([leftToRightFolderBottomFile.getId(), expect.anything()])
	expect(rightFolder.nodes.getNodes().map(node => node.getId())).toEqual([rightFolderKnot.getId()])
	const toBottomLink: Link = routeToBottomFile![1]
	const toBottomRouteId: string = HighlightPropagatingLink.getRouteIds(toBottomLink)[0]
	expect(HighlightPropagatingLink.getRouteIds(leftToRightFolderBottomFile)).toEqual([toBottomRouteId, 'toTop', 'toMid'])
	expect(HighlightPropagatingLink.getRouteIds(rightFolderKnotToTopFile)).toEqual(['toTop'])
	expect(HighlightPropagatingLink.getRouteIds(rightFolderKnotToMidFile)).toEqual(['toMid'])
	expect(HighlightPropagatingLink.getRouteIds(toBottomLink)).toEqual([toBottomRouteId])
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
	HighlightPropagatingLink.addRoute(topFileToKnot, 'fromTop')
	const midFileToKnot: Link = await rightFolder.links.add({from: rightFolderMidFile, to: rightFolderKnot, save: true})
	HighlightPropagatingLink.addRoute(midFileToKnot, 'fromMid')
	const knotToLeftFile: Link = await root.links.add({from: rightFolderKnot, to: leftFile, save: true})
	HighlightPropagatingLink.addRoutes(knotToLeftFile, ['fromTop', 'fromMid'])
	const bottomFileToLeftFile: Link = await root.links.add({from: rightFolderBottomFile, to: leftFile, save: true})

	await linkBundler.bundleLink(knotToLeftFile, {entangleLinks: true})

	const routeFromTopFile: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderTopFile, leftFile)
	const routeFromMidFile: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderMidFile, leftFile)
	const routeFromBottomFile: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderBottomFile, leftFile)
	expect(routeFromTopFile?.map(node => node.getId())).toEqual([topFileToKnot.getId(), bottomFileToLeftFile.getId()])
	expect(routeFromMidFile?.map(node => node.getId())).toEqual([midFileToKnot.getId(), bottomFileToLeftFile.getId()])
	expect(routeFromBottomFile?.map(node => node.getId())).toEqual([expect.anything(), bottomFileToLeftFile.getId()])
	expect(rightFolder.nodes.getNodes().map(node => node.getId())).toEqual([rightFolderKnot.getId()])
	const fromBottomLink: Link = routeFromBottomFile![0]
	const fromBottomRouteId: string = HighlightPropagatingLink.getRouteIds(fromBottomLink)[0]
	expect(HighlightPropagatingLink.getRouteIds(bottomFileToLeftFile)).toEqual([fromBottomRouteId, 'fromTop', 'fromMid'])
	expect(HighlightPropagatingLink.getRouteIds(topFileToKnot)).toEqual(['fromTop'])
	expect(HighlightPropagatingLink.getRouteIds(midFileToKnot)).toEqual(['fromMid'])
	expect(HighlightPropagatingLink.getRouteIds(fromBottomLink)).toEqual([fromBottomRouteId])
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
	await linkBundler.bundleLink(topLink, {entangleLinks: true})

	const bottomLink: Link = await root.links.add({from: leftFolderBottomFile, to: rightFolderBottomFile, save: true})
	await linkBundler.bundleLink(bottomLink, {entangleLinks: true})

	const topRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)
	const midRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderMidFile, rightFolderMidFile)
	const bottomRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)
	expect(topRoute?.map(node => node.getId())).toEqual([topLink.getId(), midLink.getId(), expect.anything()])
	expect(midRoute?.map(node => node.getId())).toEqual([expect.anything(), midLink.getId(), expect.anything()])
	expect(bottomRoute?.map(node => node.getId())).toEqual([bottomLink.getId(), midLink.getId(), expect.anything()])
	const topRouteId: string = HighlightPropagatingLink.getRouteIds(topRoute![0])[0]
	const midRouteId: string = HighlightPropagatingLink.getRouteIds(midRoute![0])[0]
	const bottomRouteId: string = HighlightPropagatingLink.getRouteIds(bottomRoute![0])[0]
	expect(topRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[topRouteId], [midRouteId, topRouteId, bottomRouteId], [topRouteId]])
	expect(midRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[midRouteId], [midRouteId, topRouteId, bottomRouteId], [midRouteId]])
	expect(bottomRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[bottomRouteId], [midRouteId, topRouteId, bottomRouteId], [bottomRouteId]])
	expect(topRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [topLink.getId()]])
	expect(midRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [expect.anything()]])
	expect(bottomRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[expect.anything()], [], [bottomLink.getId()]])
})

test('bundleLink, linkToBundle starts with knot, knot on toSide needs to be inserted', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const topToTopLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFolderTopFile, save: true})
	const bottomToTopLink: Link = await root.links.add({from: leftFolderBottomFile, to: rightFolderTopFile, save: true})
	await linkBundler.bundleLink(topToTopLink, {entangleLinks: true})

	const tempTopToTopRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)
	const tempBottomToTopRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderTopFile)
	expect(tempTopToTopRoute?.map(node => node.getId())).toEqual([topToTopLink.getId(), bottomToTopLink.getId()])
	expect(tempBottomToTopRoute?.map(node => node.getId())).toEqual([expect.anything(), bottomToTopLink.getId()])
	const topToTopRouteId: string = HighlightPropagatingLink.getRouteIds(tempTopToTopRoute![0])[0]
	const bottomToTopRouteId: string = HighlightPropagatingLink.getRouteIds(tempBottomToTopRoute![0])[0]

	const bottomToBottomLink: Link = await root.links.add({from: leftFolderBottomFile, to: rightFolderBottomFile, save: true})
	await linkBundler.bundleLink(bottomToTopLink, {entangleLinks: true})

	const topToTopRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)
	const bottomToTopRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderTopFile)
	const bottomToBottomRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)
	expect(topToTopRoute?.map(node => node.getId())).toEqual([topToTopLink.getId(), bottomToBottomLink.getId(), bottomToTopLink.getId()])
	expect(BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderBottomFile)?.map(link => link.getId())).toBe(undefined)
	expect(bottomToTopRoute?.map(node => node.getId())).toEqual([expect.anything(), bottomToBottomLink.getId(), bottomToTopLink.getId()])
	expect(bottomToBottomRoute?.map(node => node.getId())).toEqual([expect.anything(), bottomToBottomLink.getId(), expect.anything()])
	const bottomToBottomRouteId: string = HighlightPropagatingLink.getRouteIds(bottomToBottomRoute![2])[0]
	expect(topToTopRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[topToTopRouteId], [bottomToBottomRouteId, bottomToTopRouteId, topToTopRouteId], [bottomToTopRouteId, topToTopRouteId]])
	expect(bottomToTopRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[bottomToTopRouteId, bottomToBottomRouteId], [bottomToBottomRouteId, bottomToTopRouteId, topToTopRouteId], [bottomToTopRouteId, topToTopRouteId]])
	expect(bottomToBottomRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[bottomToTopRouteId, bottomToBottomRouteId], [bottomToBottomRouteId, bottomToTopRouteId, topToTopRouteId], [bottomToBottomRouteId]])
	expect(topToTopRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[bottomToTopLink.getId()], [], [bottomToTopRoute?.at(0)?.getId(), topToTopLink.getId()]])
	expect(bottomToTopRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[bottomToTopLink.getId(), bottomToBottomRoute?.at(2)?.getId()], [], [bottomToTopRoute?.at(0)?.getId(), topToTopLink.getId()]])
	expect(bottomToBottomRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[bottomToTopLink.getId(), bottomToBottomRoute?.at(2)?.getId()], [], [bottomToBottomRoute?.at(0)?.getId()]])
})

test('bundleLink, linkToBundle ends with knot, knot on fromSide needs to be inserted', async () => {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const topToTopLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFolderTopFile, save: true})
	const topToBottomLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFolderBottomFile, save: true})
	await linkBundler.bundleLink(topToTopLink, {entangleLinks: true})

	const tempTopToTopRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)
	const tempTopToBottomRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderBottomFile)
	expect(tempTopToTopRoute?.map(node => node.getId())).toEqual([topToBottomLink.getId(), topToTopLink.getId()])
	expect(tempTopToBottomRoute?.map(node => node.getId())).toEqual([topToBottomLink.getId(), expect.anything()])
	const topToTopRouteId: string = HighlightPropagatingLink.getRouteIds(tempTopToTopRoute![1])[0]
	const topToBottomRouteId: string = HighlightPropagatingLink.getRouteIds(tempTopToBottomRoute![1])[0]

	const bottomToBottomLink: Link = await root.links.add({from: leftFolderBottomFile, to: rightFolderBottomFile, save: true})
	await linkBundler.bundleLink(topToBottomLink, {entangleLinks: true})

	const topToTopRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)
	const topToBottomRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderBottomFile)
	const bottomToBottomRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)
	expect(topToTopRoute?.map(node => node.getId())).toEqual([topToBottomLink.getId(), bottomToBottomLink.getId(), topToTopLink.getId()])
	expect(topToBottomRoute?.map(node => node.getId())).toEqual([topToBottomLink.getId(), bottomToBottomLink.getId(), expect.anything()])
	expect(BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderTopFile)?.map(link => link.getId())).toBe(undefined)
	expect(bottomToBottomRoute?.map(node => node.getId())).toEqual([expect.anything(), bottomToBottomLink.getId(), expect.anything()])
	const bottomToBottomRouteId: string = HighlightPropagatingLink.getRouteIds(bottomToBottomRoute![0])[0]
	expect(topToTopRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[topToBottomRouteId, topToTopRouteId], [bottomToBottomRouteId, topToBottomRouteId, topToTopRouteId], [topToTopRouteId]])
	expect(topToBottomRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[topToBottomRouteId, topToTopRouteId], [bottomToBottomRouteId, topToBottomRouteId, topToTopRouteId], [topToBottomRouteId, bottomToBottomRouteId]])
	expect(bottomToBottomRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[bottomToBottomRouteId], [bottomToBottomRouteId, topToBottomRouteId, topToTopRouteId], [topToBottomRouteId, bottomToBottomRouteId]])
	expect(topToTopRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[topToBottomRoute?.at(2)?.getId(), topToTopLink.getId()], [], [topToBottomLink.getId()]])
	expect(topToBottomRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[topToBottomRoute?.at(2)?.getId(), topToTopLink.getId()], [], [topToBottomLink.getId(), bottomToBottomRoute?.at(0)?.getId()]])
	expect(bottomToBottomRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[bottomToBottomRoute?.at(2)?.getId()], [], [topToBottomLink.getId(), bottomToBottomRoute?.at(0)?.getId()]])
})

test('bundleLink, boxes are already connected with links of other routes, but no route between boxes, bundle link into routeWithKnots', async () => {
	await testBundleLinkBoxesAreConnectedWithLinksButNoRoute('simpleLink', {entangleLinks: false})
	//await testBundleLinkBoxesAreConnectedWithLinksButNoRoute('simpleLink', {entangleLinks: true}) // TODO: implement case for entangle mechanism
})

test('bundleLink, boxes are already connected with links of other routes, but no route between boxes, bundle routeWithKnots into link', async () => {
	await testBundleLinkBoxesAreConnectedWithLinksButNoRoute('linkPartOfRoute', {entangleLinks: false})
	await testBundleLinkBoxesAreConnectedWithLinksButNoRoute('linkPartOfRoute', {entangleLinks: true})
})

async function testBundleLinkBoxesAreConnectedWithLinksButNoRoute(linkToBundle: 'simpleLink'|'linkPartOfRoute', options: {entangleLinks: boolean}): Promise<void> {
	await testUtil.initServicesWithMocks({hideConsoleLog: true})

	const root = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const leftFolder = boxFactory.folderOf({idOrData: new BoxData('leftFolder', 10, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const rightFolder = boxFactory.folderOf({idOrData: new BoxData('rightFolder', 60, 20, 30, 60, [], []), parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const leftFolderTopFile = boxFactory.fileOf({idOrData: 'leftFolderTopFile', parent: leftFolder, addToParent: true, rendered: true})
	const leftFolderBottomFile = boxFactory.fileOf({idOrData: 'leftFolderBottomFile', parent: leftFolder, addToParent: true, rendered: true})
	const rightFolderTopFile = boxFactory.fileOf({idOrData: 'rightFolderTopFile', parent: rightFolder, addToParent: true, rendered: true})
	const rightFolderBottomFile = boxFactory.fileOf({idOrData: 'rightFolderBottomFile', parent: rightFolder, addToParent: true, rendered: true})

	const topToTopLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFolderTopFile, save: true})
	const topToBottomLink: Link = await root.links.add({from: leftFolderTopFile, to: rightFolderBottomFile, save: true})
	await linkBundler.bundleLink(topToTopLink, options)
	
	const tempTopToTopRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)
	const tempTopToBottomRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderBottomFile)
	expect(tempTopToTopRoute?.map(node => node.getId())).toEqual([topToBottomLink.getId(), topToTopLink.getId()])
	expect(tempTopToBottomRoute?.map(node => node.getId())).toEqual([topToBottomLink.getId(), expect.anything()])
	const topToTopRouteId: string = HighlightPropagatingLink.getRouteIds(tempTopToTopRoute![1])[0]
	const topToBottomRouteId: string = HighlightPropagatingLink.getRouteIds(tempTopToBottomRoute![1])[0]

	const bottomToTopLink: Link = await root.links.add({from: leftFolderBottomFile, to: rightFolderTopFile, save: true})
	await linkBundler.bundleLink(bottomToTopLink, options)

	const tempBottomToTopRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderTopFile)
	expect(tempBottomToTopRoute?.map(node => node.getId())).toEqual([bottomToTopLink.getId(), topToBottomLink.getId(), topToTopLink.getId()])
	const bottomToTopRouteId: string = HighlightPropagatingLink.getRouteIds(tempBottomToTopRoute![0])[0]
	expect(BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)).toBe(undefined)

	const bottomToBottomLink: Link = await root.links.add({from: leftFolderBottomFile, to: rightFolderBottomFile, save: true})
	const bundleLink: Link = linkToBundle === 'simpleLink' ? bottomToBottomLink : topToBottomLink
	const bundleIntoLink: Link = linkToBundle === 'simpleLink' ? topToBottomLink : bottomToBottomLink
	await linkBundler.bundleLink(bundleLink, options)

	const topToTopRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderTopFile)
	const topToBottomRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderTopFile, rightFolderBottomFile)
	const bottomToTopRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderTopFile)
	const bottomToBottomRoute: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderBottomFile, rightFolderBottomFile)
	expect(topToTopRoute?.map(node => node.getId())).toEqual([expect.anything(), bundleIntoLink.getId(), topToTopLink.getId()])
	expect(topToBottomRoute?.map(node => node.getId())).toEqual([expect.anything(), bundleIntoLink.getId(), expect.anything()])
	expect(bottomToTopRoute?.map(link => link.getId())).toEqual([bottomToTopLink.getId(), bundleIntoLink.getId(), topToTopLink.getId()])
	expect(bottomToBottomRoute?.map(node => node.getId())).toEqual([bottomToTopLink.getId(), bundleIntoLink.getId(), expect.anything()])
	expect(root.links.getLinks().length).toBe(1)
	expect(leftFolder.links.getLinks().length).toBe(2)
	expect(rightFolder.links.getLinks().length).toBe(2)
	expect(leftFolderBottomFile.links.getLinks().length).toBe(0)
	expect(rightFolderBottomFile.links.getLinks().length).toBe(0)
	expect([leftFolder, leftFolderTopFile, leftFolderBottomFile, rightFolder, rightFolderTopFile, rightFolderBottomFile].map(box => box.borderingLinks.getAll().length)).toEqual([1, 1, 1, 1, 1, 1])
	const bottomToBottomRouteId: string = HighlightPropagatingLink.getRouteIds(bottomToBottomRoute![0]).find(routeId => routeId !== bottomToTopRouteId)!
	const allRouteIds: string[] = linkToBundle === 'simpleLink'
		? [topToBottomRouteId, topToTopRouteId, bottomToTopRouteId, bottomToBottomRouteId]
		: [bottomToBottomRouteId, topToBottomRouteId, topToTopRouteId, bottomToTopRouteId]
	expect(topToTopRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[topToBottomRouteId, topToTopRouteId], allRouteIds, [topToTopRouteId, bottomToTopRouteId]])
	expect(topToBottomRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[topToBottomRouteId, topToTopRouteId], allRouteIds, [topToBottomRouteId, bottomToBottomRouteId]])
	expect(bottomToTopRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[bottomToTopRouteId, bottomToBottomRouteId], allRouteIds, [topToTopRouteId, bottomToTopRouteId]])
	expect(bottomToBottomRoute?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[bottomToTopRouteId, bottomToBottomRouteId], allRouteIds, [topToBottomRouteId, bottomToBottomRouteId]])
	if (options.entangleLinks) {
		expect(topToTopRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[topToBottomRoute?.at(2)?.getId(), topToTopLink.getId()], [], [topToTopRoute?.at(0)?.getId(), bottomToTopLink.getId()]])
		expect(topToBottomRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[topToBottomRoute?.at(2)?.getId(), topToTopLink.getId()], [], [topToBottomRoute?.at(0)?.getId(), bottomToBottomRoute?.at(0)?.getId()]])
		expect(bottomToTopRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[bottomToTopRoute?.at(2)?.getId(), bottomToBottomRoute?.at(2)?.getId()], [], [topToTopRoute?.at(0)?.getId(), bottomToTopLink.getId()]])
		expect(bottomToBottomRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[bottomToTopRoute?.at(2)?.getId(), bottomToBottomRoute?.at(2)?.getId()], [], [topToBottomRoute?.at(0)?.getId(), bottomToBottomRoute?.at(0)?.getId()]])
	} else {
		expect(topToTopRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], [], []])
		expect(topToBottomRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], [], []])
		expect(bottomToTopRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], [], []])
		expect(bottomToBottomRoute?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[], [], []])
	}
}

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

	await linkBundler.bundleLink(link1, {entangleLinks: true})
	await linkBundler.bundleLink(link3, {entangleLinks: true})

	expect(BoxLinks.findLinkRoute(leftFolderFile1, rightFolderTopFile)?.at(1)?.getId()).toBe(link2.getId())
	expect(BoxLinks.findLinkRoute(leftFolderFile3, rightFolderBottomFile)?.at(1)?.getId()).toBe(link4.getId())

	await linkBundler.bundleLink(link2, {entangleLinks: true})

	const route1: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile1, rightFolderTopFile)
	const route2: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile2, rightFolderTopFile)
	const route3: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile3, rightFolderBottomFile)
	const route4: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile4, rightFolderBottomFile)
	expect(route1?.map(link => link.getId())).toEqual([link1.getId(), link4.getId(), link2.getId()])
	expect(route2?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), link2.getId()])
	expect(route3?.map(link => link.getId())).toEqual([link3.getId(), link4.getId(), expect.anything()])
	expect(route4?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), expect.anything()])
	const route1Id: string = HighlightPropagatingLink.getRouteIds(route1![0])[0]
	const route2Id: string = HighlightPropagatingLink.getRouteIds(route2![0])[0]
	const route3Id: string = HighlightPropagatingLink.getRouteIds(route3![0])[0]
	const route4Id: string = HighlightPropagatingLink.getRouteIds(route4![0])[0]
	expect(route1?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route1Id], [route4Id, route3Id, route2Id, route1Id], [route2Id, route1Id]])
	expect(route2?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route2Id], [route4Id, route3Id, route2Id, route1Id], [route2Id, route1Id]])
	expect(route3?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route3Id], [route4Id, route3Id, route2Id, route1Id], [route4Id, route3Id]])
	expect(route4?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route4Id], [route4Id, route3Id, route2Id, route1Id], [route4Id, route3Id]])
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

	await linkBundler.bundleLink(link1, {entangleLinks: true})
	await linkBundler.bundleLink(link3, {entangleLinks: true})

	expect(BoxLinks.findLinkRoute(rightFolderTopFile, leftFolderFile1)?.at(0)?.getId()).toBe(link2.getId())
	expect(BoxLinks.findLinkRoute(rightFolderBottomFile, leftFolderFile3)?.at(0)?.getId()).toBe(link4.getId())

	await linkBundler.bundleLink(link2, {entangleLinks: true})

	const route1: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderTopFile, leftFolderFile1)
	const route2: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderTopFile, leftFolderFile2)
	const route3: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderBottomFile, leftFolderFile3)
	const route4: Link[]|undefined = BoxLinks.findLinkRoute(rightFolderBottomFile, leftFolderFile4)
	expect(route1?.map(link => link.getId())).toEqual([link2.getId(), link4.getId(), link1.getId()])
	expect(route2?.map(link => link.getId())).toEqual([link2.getId(), link4.getId(), expect.anything()])
	expect(route3?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), link3.getId()])
	expect(route4?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), expect.anything()])
	const route1Id: string = HighlightPropagatingLink.getRouteIds(route1![2])[0]
	const route2Id: string = HighlightPropagatingLink.getRouteIds(route2![2])[0]
	const route3Id: string = HighlightPropagatingLink.getRouteIds(route3![2])[0]
	const route4Id: string = HighlightPropagatingLink.getRouteIds(route4![2])[0]
	expect(route1?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route2Id, route1Id], [route4Id, route3Id, route2Id, route1Id], [route1Id]])
	expect(route2?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route2Id, route1Id], [route4Id, route3Id, route2Id, route1Id], [route2Id]])
	expect(route3?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route4Id, route3Id], [route4Id, route3Id, route2Id, route1Id], [route3Id]])
	expect(route4?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route4Id, route3Id], [route4Id, route3Id, route2Id, route1Id], [route4Id]])
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
	await linkBundler.bundleLink(link1, {entangleLinks: true})
	
	const link3: Link = await root.links.add({from: leftFolderFile3, to: rightFolderFile3, save: true})
	const link4: Link = await root.links.add({from: leftFolderFile4, to: rightFolderFile3, save: true})
	await linkBundler.bundleLink(link3, {entangleLinks: true})

	const tempRoute1: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile1, rightFolderFile1)
	const tempRoute3: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile3, rightFolderFile3)
	const tempRoute4: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile4, rightFolderFile3)
	expect(tempRoute1?.map(link => link.getId())).toEqual([link1.getId(), link2.getId(), expect.anything()])
	expect(tempRoute3?.map(link => link.getId())).toEqual([link3.getId(), link4.getId()])
	expect(tempRoute4?.map(link => link.getId())).toEqual([expect.anything(), link4.getId()])
	const route3Id: string = HighlightPropagatingLink.getRouteIds(tempRoute3![0])[0]
	const route4Id: string = HighlightPropagatingLink.getRouteIds(tempRoute4![0])[0]
	
	const link5: Link = await root.links.add({from: leftFolderFile4, to: rightFolderFile4, save: true})
	await linkBundler.bundleLink(link5, {entangleLinks: true})

	const temporaryRoute3: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile3, rightFolderFile3)
	const temporaryRoute4: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile4, rightFolderFile3)
	const temporaryRoute5: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile4, rightFolderFile4)
	expect(temporaryRoute3?.map(link => link.getId())).toEqual([link3.getId(), link4.getId(), expect.anything()])
	expect(temporaryRoute4?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), expect.anything()])
	expect(temporaryRoute5?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), link5.getId()])
	expect(BoxLinks.findLinkRoute(leftFolderFile3, rightFolderFile4)?.map(link => link.getId())).toBe(undefined)
	const route5Id: string = HighlightPropagatingLink.getRouteIds(temporaryRoute5![2])[0]
	expect(temporaryRoute3?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route3Id], [route4Id, route3Id, route5Id], [route4Id, route3Id]])
	expect(temporaryRoute4?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route4Id, route5Id], [route4Id, route3Id, route5Id], [route4Id, route3Id]])
	expect(temporaryRoute5?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route4Id, route5Id], [route4Id, route3Id, route5Id], [route5Id]])
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

test('bundleLink, linkToBundle is part of route and ends with knots, multiple times', async () => {
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
	await linkBundler.bundleLink(link1, {entangleLinks: true})
	const route1Step1: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile1, rightFolderFile1)
	const route2Step1: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile2, rightFolderFile2)
	expect(route1Step1?.map(link => link.getId())).toEqual([link1.getId(), link2.getId(), expect.anything()])
	expect(route2Step1?.map(link => link.getId())).toEqual([expect.anything(), link2.getId(), expect.anything()])
	const route1Id: string = HighlightPropagatingLink.getRouteIds(route1Step1![0])[0]
	const route2Id: string = HighlightPropagatingLink.getRouteIds(route2Step1![0])[0]
	expect(route1Step1?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route1Id], [route2Id, route1Id], [route1Id]])
	expect(route2Step1?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route2Id], [route2Id, route1Id], [route2Id]])
	expect(route1Step1?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route1Step1?.at(2)?.getId()], [], [link1.getId()]])
	expect(route2Step1?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route2Step1?.at(2)?.getId()], [], [route2Step1?.at(0)?.getId()]])
	
	const link3: Link = await root.links.add({from: leftFolderFile3, to: rightFolderFile3, save: true})
	await linkBundler.bundleLink(link2, {entangleLinks: true})
	const route1Step2: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile1, rightFolderFile1)
	const route2Step2: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile2, rightFolderFile2)
	const route3Step2: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile3, rightFolderFile3)
	expect(route1Step2?.map(link => link.getId())).toEqual([link1.getId(), link3.getId(), route1Step1?.at(2)?.getId()])
	expect(route2Step2?.map(link => link.getId())).toEqual([route2Step1?.at(0)?.getId(), link3.getId(), route2Step1?.at(2)?.getId()])
	expect(route3Step2?.map(link => link.getId())).toEqual([expect.anything(), link3.getId(), expect.anything()])
	const route3Id: string = HighlightPropagatingLink.getRouteIds(route3Step2![0])[0]
	expect(route3Step2?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route3Id], [route3Id, route2Id, route1Id], [route3Id]])
	expect(route1Step2?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route1Step1?.at(2)?.getId()], [], [link1.getId()]])
	expect(route2Step2?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route2Step1?.at(2)?.getId()], [], [route2Step1?.at(0)?.getId()]])
	expect(route3Step2?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route3Step2?.at(2)?.getId()], [], [route3Step2?.at(0)?.getId()]])

	const link3Duplicate: Link = await root.links.add({from: leftFolderFile3, to: rightFolderFile3, save: true})
	const consoleWarnMock = jest.spyOn(console, 'warn').mockImplementation()
	try {
		await linkBundler.bundleLink(link3, {entangleLinks: true})
		const route1Step3: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile1, rightFolderFile1)
		const route2Step3: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile2, rightFolderFile2)
		const route3Step3: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile3, rightFolderFile3)
		expect(route1Step3?.map(link => link.getId())).toEqual([link1.getId(), link3Duplicate.getId(), route1Step1?.at(2)?.getId()])
		expect(route2Step3?.map(link => link.getId())).toEqual([route2Step1?.at(0)?.getId(), link3Duplicate.getId(), route2Step1?.at(2)?.getId()])
		expect(route3Step3?.map(link => link.getId())).toEqual([expect.anything(), link3Duplicate.getId(), expect.anything()])
		expect(route1Step3?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route1Id], [route3Id, route2Id, route1Id], [route1Id]])
		expect(route2Step3?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route2Id], [route3Id, route2Id, route1Id], [route2Id]])
		expect(route3Step2?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route3Id], [route3Id, route2Id, route1Id], [route3Id]])
		expect(route1Step3?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route1Step1?.at(2)?.getId()], [], [link1.getId()]])
		expect(route2Step3?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route2Step1?.at(2)?.getId()], [], [route2Step1?.at(0)?.getId()]])
		expect(route3Step3?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route3Step2?.at(2)?.getId()], [], [route3Step2?.at(0)?.getId()]])
		const warnCalls: string[] = consoleWarnMock.mock.calls.map(call => call.join())
		expect(warnCalls.length).toBe(1)
		expect(warnCalls[0].startsWith(`linkBundler.ensureNoRedundantRouteIds(from: 'leftFolderFile3Name', to: 'rightFolderFile3Name', ..) detected redundant routeIds [${route3Id}`)).toBe(true)
		expect(warnCalls[0].endsWith(`], removing them except '${route3Id}'`)).toBe(true)
	} finally {
		consoleWarnMock.mockRestore()
	}

	const link4: Link = await root.links.add({from: leftFolderFile4, to: rightFolderFile4, save: true})
	await linkBundler.bundleLink(link3Duplicate, {entangleLinks: true})
	const route1Step4: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile1, rightFolderFile1)
	const route2Step4: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile2, rightFolderFile2)
	const route3Step4: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile3, rightFolderFile3)
	const route4Step4: Link[]|undefined = BoxLinks.findLinkRoute(leftFolderFile4, rightFolderFile4)
	expect(route1Step4?.map(link => link.getId())).toEqual([link1.getId(), link4.getId(), route1Step1?.at(2)?.getId()])
	expect(route2Step4?.map(link => link.getId())).toEqual([route2Step1?.at(0)?.getId(), link4.getId(), route2Step1?.at(2)?.getId()])
	expect(route3Step4?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), expect.anything()])
	expect(route4Step4?.map(link => link.getId())).toEqual([expect.anything(), link4.getId(), expect.anything()])
	const route4Id: string = HighlightPropagatingLink.getRouteIds(route4Step4![0])[0]
	expect(route1Step4?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route1Id], [route4Id, route3Id, route2Id, route1Id], [route1Id]])
	expect(route2Step4?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route2Id], [route4Id, route3Id, route2Id, route1Id], [route2Id]])
	expect(route3Step4?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route3Id], [route4Id, route3Id, route2Id, route1Id], [route3Id]])
	expect(route4Step4?.map(link => HighlightPropagatingLink.getRouteIds(link))).toEqual([[route4Id], [route4Id, route3Id, route2Id, route1Id], [route4Id]])
	expect(route1Step4?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route1Step1?.at(2)?.getId()], [], [link1.getId()]])
	expect(route2Step4?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route2Step1?.at(2)?.getId()], [], [route2Step1?.at(0)?.getId()]])
	expect(route3Step4?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route3Step2?.at(2)?.getId()], [], [route3Step2?.at(0)?.getId()]])
	expect(route4Step4?.map(link => HighlightPropagatingLink.getBundledWithIds(link))).toEqual([[route4Step4?.at(2)?.getId()], [], [route4Step4?.at(0)?.getId()]])
})