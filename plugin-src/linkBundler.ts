import { BoxLinks } from '../dist/core/box/BoxLinks'
import { Box } from '../dist/core/box/Box'
import { BoxWatcher } from '../dist/core/box/BoxWatcher'
import { Link } from '../dist/core/link/Link'
import { WayPointData } from '../dist/core/mapData/WayPointData'
import { NodeWidget } from '../dist/core/node/NodeWidget'
import * as contextMenu from '../dist/core/contextMenu'
import { applicationMenu } from '../dist/core/applicationMenu/applicationMenu'
import { MenuItemFile } from '../dist/core/applicationMenu/MenuItemFile'
import * as bundler from './linkBundler/bundler'
import * as pluginFacade from '../dist/pluginFacade'
import { coreUtil } from '../dist/pluginFacade'

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
		scheduleBundleLink(link)
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

const queue: {linkId: string, managingBoxSrcPath: string}[] = []
let processing: boolean = false

function scheduleBundleLink(link: Link): void {
	queue.push({linkId: link.getId(), managingBoxSrcPath: link.getManagingBox().getSrcPath()})
	processQueue()
}

async function processQueue(): Promise<void> {
	if (processing) {
		return
	}
	processing = true
	updateProgressBar()
	
	for (let element = queue.pop(); element; element = queue.pop()) {
		const {boxWatcher: managingBox} = await pluginFacade.getMapOrError().getBoxBySourcePathAndRenderIfNecessary(element.managingBoxSrcPath)
		if (!managingBox) {
			console.warn(`linkBundler.processQueue() failed to getBoxBySourcePathAndRenderIfNecessary('${element.managingBoxSrcPath}')`)
			continue
		}
		const link: Link|undefined = (await managingBox.get()).links.getLinks().find(link => link.getId() === element!.linkId)
		if (!link) {
			console.warn(`linkBundler.processQueue() managingBox '${element.managingBoxSrcPath}' does not contain link with id '${element.linkId}'`)
			continue
		}
		await bundler.bundleLink(link, {unwatchDelayInMs: 500})
		
		managingBox.unwatch()
		updateProgressBar()
	}

	processing = false
}

const progressBarId: string = 'linkBundlerProgressBar'+coreUtil.generateId()
let progressBarMounted: boolean = false

async function updateProgressBar(): Promise<void> {
	if (queue.length === 0) {
		await removeProgressBar()
		return
	}
	const innerShape: pluginFacade.RenderElements = `scheduled ${queue.length} links to bundle`
	if (!progressBarMounted) {
		progressBarMounted = true
		await pluginFacade.renderManager.addElementTo(pluginFacade.mainWidget.getId(), {
			type: 'div',
			id: progressBarId,
			style: {
				position: 'absolute',
				right: '20%',
				bottom: '15%',
				margin: '8px'
			},
			children: innerShape
		})
	} else {
		await pluginFacade.renderManager.setElementsTo(progressBarId, innerShape)
	}
}

async function removeProgressBar(): Promise<void> {
	if (!progressBarMounted) {
		return
	}
	progressBarMounted = false
	await pluginFacade.renderManager.remove(progressBarId)
}