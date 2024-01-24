import { BoxLinks } from '../dist/core/box/BoxLinks'
import { Box } from '../dist/core/box/Box'
import { BoxWatcher } from '../dist/core/box/BoxWatcher'
import { Link } from '../dist/core/link/Link'
import { WayPointData } from '../dist/core/mapData/WayPointData'
import { NodeWidget } from '../dist/core/node/NodeWidget'
import * as contextMenu from '../dist/core/contextMenu'
import { applicationMenu } from '../dist/core/applicationMenu/applicationMenu'
import { MenuItemFile } from '../dist/core/applicationMenu/MenuItemFile'
/**
 * pluginFacade not used in imports because
 * some imports could not be resolved when importing from '../dist/pluginFacade' and cause:
 * "TypeError: Class extends value undefined is not a constructor or null"
 * TODO fix this!
 */
import * as bundler from './linkBundler/bundler'

contextMenu.addLinkMenuItem((link: Link) => new MenuItemFile({label: 'bundle', click: () => bundler.bundleLink(link)}))

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

// ?. because applicationMenu is not initialized for unit tests
applicationMenu?.addMenuItemTo('linkBundler.js', activateBundleNewLinksItem)
applicationMenu?.addMenuItemTo('linkBundler.js', deactivateBundleNewLinksItem)

function activateBundleNewLinks(): void {
	if (bundleNewLinksActivated) {
		console.warn(`bundleNewLinks is already activated`)
		return
	}
	bundleNewLinksActivated = true
	addLinkBackup = BoxLinks.prototype.add
	BoxLinks.prototype.add = async function (options) {
		const link: Link = await addLinkBackup.call(this, options)
		await bundler.bundleLink(link)
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

// TODO add a method like this to LinkEnd::getTargetAndRenderIfNecessary()?
async function getLinkEndNode(link: Link, end: 'from'|'to'): Promise<{
	node: Box|NodeWidget
	watcher: BoxWatcher
}> {
	const linkEndPath: WayPointData[] = link.getData()[end].path
	if (linkEndPath.length === 1 && linkEndPath[0].boxId === link.getManagingBox().getId()) {
		return {node: link.getManagingBox(), watcher: await BoxWatcher.newAndWatch(link.getManagingBox())}
	}
	return link.getManagingBox().getDescendantByPathAndRenderIfNecessary(linkEndPath.map(wayPoint => {
		return {id: wayPoint.boxId}
	}))
}
