import { BoxLinks } from '../../../src/core/box/BoxLinks'
import { FileBox } from '../../../src/core/box/FileBox'
import { RootFolderBox } from '../../../src/core/box/RootFolderBox'
import { Link } from '../../../src/core/link/Link'
import * as boxFactory from './factories/boxFactory'
import { mock } from 'jest-mock-extended'
import { RenderManager, init as initRenderManager } from '../../../src/core/RenderManager'
import { BoxManager, init as initBoxManager } from '../../../src/core/box/BoxManager'

test('getLinkRouteWithEndBoxes no links exist', () => {
	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root'})
	const from: FileBox = boxFactory.fileOf({
		idOrData: 'from',
		parent: root
	})
	const to: FileBox = boxFactory.fileOf({
		idOrData: 'to',
		parent: root
	})
	expect(BoxLinks.getLinkRouteWithEndBoxes(from, to)).toBe(undefined)
})

test('getLinkRouteWithEndBoxes directly connected', async () => {
	initRenderManager(mock<RenderManager>()) // TODO: use init function in util
	initBoxManager(mock<BoxManager>())

	const root: RootFolderBox = boxFactory.rootFolderOf({idOrSettings: 'root', rendered: true, bodyRendered: true})
	const from: FileBox = boxFactory.fileOf({idOrData: 'from', parent: root, rendered: true})
	const to: FileBox = boxFactory.fileOf({idOrData: 'to', parent: root, rendered: true})
	root.addBox(from) // TODO: add to parent already in factory
	root.addBox(to)

	const link: Link = await root.links.add(from, to)
	expect(BoxLinks.getLinkRouteWithEndBoxes(from, to)).toEqual([link])
})
