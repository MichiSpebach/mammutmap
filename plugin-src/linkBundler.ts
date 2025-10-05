import { BoxLinks } from '../src/core/box/BoxLinks'
import { Box } from '../src/core/box/Box'
import { Link } from '../src/core/link/Link'
import { NodeWidget } from '../src/core/node/NodeWidget'
import * as contextMenu from '../src/core/contextMenu'
import { applicationMenu } from '../src/core/applicationMenu/applicationMenu'
import { MenuItemFile } from '../src/core/applicationMenu/MenuItemFile'
import * as bundler from './linkBundler/bundler'
import * as pluginFacade from '../src/pluginFacade'
import * as knotMerger from './linkBundler/knotMerger'
import { HighlightPropagatingLink } from './linkBundler/HighlightPropagatingLink'
import * as dialog from './linkBundler/dialog'
import * as scheduler from './linkBundler/scheduler'
import { FileBox } from '../src/core/box/FileBox'
import { FolderBox } from '../src/core/box/FolderBox'
import { SourcelessBox } from '../src/core/box/SourcelessBox'

pluginFacade.overrideLink(HighlightPropagatingLink)

contextMenu.addLinkMenuItem((link: Link) => new MenuItemFile({label: '↣ try to bundle', click: () => bundler.bundleLink(link)}))
contextMenu.addLinkNodeMenuItem((node: NodeWidget) => new MenuItemFile({label: 'try to merge', click: async () => {await knotMerger.mergeKnot(node)}}))

contextMenu.addFileBoxMenuItem((box: FileBox) => new MenuItemFile({label: '↣ bundle links...', click: () => dialog.openDialogForBundleLinks(box)}))
contextMenu.addFolderBoxMenuItem((box: FolderBox) => new MenuItemFile({label: '↣ bundle links...', click: () => dialog.openDialogForBundleLinks(box)}))
contextMenu.addSourcelessBoxMenuItem((box: SourcelessBox) => new MenuItemFile({label: '↣ bundle links...', click: () => dialog.openDialogForBundleLinks(box)}))

Box.Sidebar.BasicToolkit.add({
	topic: 'links',
	indexWithinTopic: 2,
	build: (box: Box) => Box.Sidebar.BasicToolkit.buildButton('↣ bundle links...', () => dialog.openDialogForBundleLinks(box))
})

let bundleNewLinksActivated: boolean = false
let addLinkBackup: ((options: any) => Promise<Link>) = BoxLinks.prototype.add

const activateBundleNewLinksItem = new MenuItemFile({label: 'activate bundle new links', enabled: !bundleNewLinksActivated, click() {
	applicationMenu.setMenuItemEnabled(activateBundleNewLinksItem, false)
	applicationMenu.setMenuItemEnabled(deactivateBundleNewLinksItem, true)
	activateBundleNewLinks()
}})
const deactivateBundleNewLinksItem = new MenuItemFile({label: 'deactivate bundle new links', enabled: bundleNewLinksActivated, click() {
	applicationMenu.setMenuItemEnabled(activateBundleNewLinksItem, true)
	applicationMenu.setMenuItemEnabled(deactivateBundleNewLinksItem, false)
	deactivateBundleNewLinks()
}})

applicationMenu.addMenuItemTo('linkBundler.js', activateBundleNewLinksItem)
applicationMenu.addMenuItemTo('linkBundler.js', deactivateBundleNewLinksItem)

function activateBundleNewLinks(): void {
	if (bundleNewLinksActivated) {
		console.warn(`bundleNewLinks is already activated`)
		return
	}
	bundleNewLinksActivated = true
	addLinkBackup = BoxLinks.prototype.add
	BoxLinks.prototype.add = async function (options) {
		const link: Link = await addLinkBackup.call(this, options)
		scheduler.scheduleBundleLink(link)
		return link
	}
	console.info(`bundleNewLinks activated`)
}

function deactivateBundleNewLinks(): void {
	if (!bundleNewLinksActivated) {
		console.warn(`bundleNewLinks is already deactivated`)
		return
	}
	bundleNewLinksActivated = false
	BoxLinks.prototype.add = addLinkBackup
	console.info(`bundleNewLinks deactivated`)
}
