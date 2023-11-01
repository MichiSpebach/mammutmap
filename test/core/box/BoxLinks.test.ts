import { BoxLinks } from '../../../src/core/box/BoxLinks'
import { FileBox } from '../../../src/core/box/FileBox'
import { RootFolderBox } from '../../../src/core/box/RootFolderBox'
import { Link } from '../../../src/core/link/Link'
import * as boxFactory from './factories/boxFactory'
import { NodeWidget } from '../../../src/core/node/NodeWidget'
import { NodeData } from '../../../src/core/mapData/NodeData'
import { FolderBox } from '../../../src/core/box/FolderBox'
import * as testUtil from '../../testUtil'

test('add link between Boxes', async () => {
	testUtil.initGeneralServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const from: FolderBox = boxFactory.folderOf({idOrData: 'from', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const to: FolderBox = boxFactory.folderOf({idOrData: 'to', parent: root, addToParent: true, rendered: true, bodyRendered: true})

	const link: Link = await root.links.add({from: {node: from}, to: {node: to}, save: false})
	expect(link.getData().from.path.map(wayPoint => wayPoint.boxId)).toEqual(['from'])
	expect(link.getData().to.path.map(wayPoint => wayPoint.boxId)).toEqual(['to'])
	expect(link.from.getRenderedPathWithoutManagingBox().map(node => node.getId())).toEqual(['from'])
	expect(link.to.getRenderedPathWithoutManagingBox().map(node => node.getId())).toEqual(['to'])
})

test('add link between nested Boxes', async () => {
	testUtil.initGeneralServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const fromOuter: FolderBox = boxFactory.folderOf({idOrData: 'fromOuter', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const fromInner: FileBox = boxFactory.fileOf({idOrData: 'fromInner', parent: fromOuter, addToParent: true, rendered: true, bodyRendered: true})
	const toOuter: FolderBox = boxFactory.folderOf({idOrData: 'toOuter', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const toInner: FileBox = boxFactory.fileOf({idOrData: 'toInner', parent: toOuter, addToParent: true, rendered: true, bodyRendered: true})

	const link: Link = await root.links.add({from: {node: fromInner}, to: {node: toInner}, save: true})
	expect(link.getData().from.path.map(wayPoint => wayPoint.boxId)).toEqual(['fromOuter', 'fromInner'])
	expect(link.getData().to.path.map(wayPoint => wayPoint.boxId)).toEqual(['toOuter', 'toInner'])
	expect(link.from.getRenderedPathWithoutManagingBox().map(node => node.getId())).toEqual(['fromOuter', 'fromInner'])
	expect(link.to.getRenderedPathWithoutManagingBox().map(node => node.getId())).toEqual(['toOuter', 'toInner'])
})

test('add link between LinkNodes', async () => {
	testUtil.initGeneralServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})

	const from: FolderBox = boxFactory.folderOf({idOrData: 'from', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	await from.nodes.add(NodeData.buildNew(50, 50))
	const fromNode: NodeWidget = from.nodes.getNodes()[0]
	
	const to: FolderBox = boxFactory.folderOf({idOrData: 'to', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	await to.nodes.add(NodeData.buildNew(50, 50))
	const toNode: NodeWidget = to.nodes.getNodes()[0]

	const link: Link = await root.links.add({from: {node: fromNode}, to: {node: toNode}, save: false})
	expect(link.getData().from.path.map(wayPoint => wayPoint.boxId)).toEqual(['from', fromNode.getId()])
	expect(link.getData().to.path.map(wayPoint => wayPoint.boxId)).toEqual(['to', toNode.getId()])
	expect(link.from.getRenderedPathWithoutManagingBox().map(node => node.getId())).toEqual(['from', fromNode.getId()])
	expect(link.to.getRenderedPathWithoutManagingBox().map(node => node.getId())).toEqual(['to', toNode.getId()])
})

test('findLinkRoute no links exist', () => {
	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root'})
	const from: FileBox = boxFactory.fileOf({idOrData: 'from', parent: root, addToParent: false})
	const to: FileBox = boxFactory.fileOf({idOrData: 'to', parent: root, addToParent: false})
	expect(BoxLinks.findLinkRoute(from, to)).toBe(undefined)
})

test('findLinkRoute directly connected', async () => {
	testUtil.initGeneralServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const from: FileBox = boxFactory.fileOf({idOrData: 'from', parent: root, addToParent: true, rendered: true})
	const to: FileBox = boxFactory.fileOf({idOrData: 'to', parent: root, addToParent: true, rendered: true})

	const link: Link = await root.links.add({from: {node: from}, to: {node: to}, save: false})
	expect(BoxLinks.findLinkRoute(from, to)).toEqual([link])
})

test('findLinkRoute one node between', async () => {
	testUtil.initGeneralServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const fromOuter: FolderBox = boxFactory.folderOf({idOrData: 'fromOuter', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	await fromOuter.nodes.add(NodeData.buildNew(50, 50))
	const node: NodeWidget = fromOuter.nodes.getNodes()[0]//linkNodeFactory.of('node', from)
	const fromInner: FileBox = boxFactory.fileOf({idOrData: 'fromInner', parent: fromOuter, addToParent: true, rendered: true, bodyRendered: true})
	const to: FileBox = boxFactory.fileOf({idOrData: 'to', parent: root, addToParent: true, rendered: true})

	const link1: Link = await fromOuter.links.add({from: fromInner, to: node, save: false})
	const link2: Link = await root.links.add({from: node, to, save: false})
	expect(BoxLinks.findLinkRoute(fromInner, to)?.map(link => link.getId())).toEqual([link1.getId(), link2.getId()])
})

test('findLinkRoute two nodes between', async () => {
	const {from, to, link1, link2, link3} = await buildScenarioWithTwoNodesBetween()
	expect(BoxLinks.findLinkRoute(from, to)?.map(link => link.getId())).toEqual([link1.getId(), link2.getId(), link3.getId()])
})

test('findLinkRoute route exists but too many hops', async () => {
	const {from, to} = await buildScenarioWithTwoNodesBetween()
	expect(BoxLinks.findLinkRoute(from, to, {maxHops: 1})?.map(link => link.getId())).toEqual(undefined)
})

async function buildScenarioWithTwoNodesBetween(): Promise<{from: FileBox, to: FileBox, link1: Link, link2: Link, link3: Link}> {
	testUtil.initGeneralServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})

	const fromOuter: FolderBox = boxFactory.folderOf({idOrData: 'fromOuter', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	await fromOuter.nodes.add(NodeData.buildNew(50, 50))
	const fromNode: NodeWidget = fromOuter.nodes.getNodes()[0]
	const fromInner: FileBox = boxFactory.fileOf({idOrData: 'fromInner', parent: fromOuter, addToParent: true, rendered: true, bodyRendered: true})
	
	const toOuter: FolderBox = boxFactory.folderOf({idOrData: 'toOuter', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	await toOuter.nodes.add(NodeData.buildNew(50, 50))
	const toNode: NodeWidget = toOuter.nodes.getNodes()[0]
	const toInner: FileBox = boxFactory.fileOf({idOrData: 'toInner', parent: toOuter, addToParent: true, rendered: true, bodyRendered: true})

	const link1: Link = await fromOuter.links.add({from: fromInner, to: fromNode, save: true})
	const link2: Link = await root.links.add({from: fromNode, to: toNode, save: true})
	const link3: Link = await toOuter.links.add({from: toNode, to: toInner, save: true})
	return {from: fromInner, to: toInner, link1, link2, link3}
}

test('findLinkRoute some link exists but not connected', async () => {
	testUtil.initGeneralServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const fromOuter: FolderBox = boxFactory.folderOf({idOrData: 'fromOuter', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	await fromOuter.nodes.add(NodeData.buildNew(50, 50))
	const node: NodeWidget = fromOuter.nodes.getNodes()[0]
	const fromInner: FileBox = boxFactory.fileOf({idOrData: 'fromInner', parent: fromOuter, addToParent: true, rendered: true, bodyRendered: true})
	const to: FileBox = boxFactory.fileOf({idOrData: 'to', parent: root, addToParent: true, rendered: true, bodyRendered: true})

	const link1: Link = await fromOuter.links.add({from: fromInner, to: node, save: true})
	expect(BoxLinks.findLinkRoute(fromInner, to)?.map(link => link.getId())).toEqual(undefined)
})

test('findLinkRoute file between but no LinkNode', async () => {
	testUtil.initGeneralServicesWithMocks()

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const fromOuter: FolderBox = boxFactory.folderOf({idOrData: 'fromOuter', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const fromInner: FileBox = boxFactory.fileOf({idOrData: 'fromInner', parent: fromOuter, addToParent: true, rendered: true, bodyRendered: true})
	const fileBetween: FileBox = boxFactory.fileOf({idOrData: 'fileBetween', parent: root, addToParent: true, rendered: true, bodyRendered: true})
	const to: FileBox = boxFactory.fileOf({idOrData: 'to', parent: root, addToParent: true, rendered: true, bodyRendered: true})

	const link1: Link = await root.links.add({from: fromInner, to: fileBetween, save: true})
	const link2: Link = await root.links.add({from: fileBetween, to, save: true})
	expect(BoxLinks.findLinkRoute(fromInner, to)?.map(link => link.getId())).toEqual(undefined)
})